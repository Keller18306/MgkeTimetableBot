import { readdirSync } from 'fs';
import { NextMiddleware } from 'middleware-io';
import path from 'path';
import { ContextDefaultState, MessageContext, MessageEventContext, VK, getRandomId } from 'vk-io';
import { config } from '../../../../config';
import { defines } from '../../../defines';
import { FromType, InputRequestKey } from '../../../key';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils';
import { AbstractBot, AbstractCommand } from '../abstract';
import { CommandController } from '../command';
import { Keyboard } from '../keyboard';
import { VkBotAction } from './action';
import { DefaultCallback } from './callbacks/_default';
import { VkChat } from './chat';
import { VkCommandContext } from './context';
import { VkEventListener } from './event';

export class VkBot extends AbstractBot {
    private static _instance?: VkBot;

    public vk: VK
    private callbacks: {
        [id: string]: DefaultCallback;
    } = {}

    public static get instance() {
        if (!this._instance) {
            this._instance = new this()
        }

        return this._instance
    }

    constructor() {
        super('vk')
        if (VkBot._instance) throw new Error('VkBot is singleton')

        this.vk = new VK({
            pollingGroupId: config.vk.bot.id,
            token: config.vk.bot.access_token,
        })

        this.vk.updates.on('message_new', (context, next) => this.messageHandler(context, next))
        this.vk.updates.on('message_event', (context, next) => this.eventHandler(context, next))
        this.vk.updates.on('chat_invite_user', (context, next) => this.inviteUser(context, next))

        new VkEventListener(this.vk)
    }

    public run() {
        this.loadCallbacks()

        this.vk.updates.startPolling().then(() => {
            console.log('[VK Bot] Start polling...')
        }).catch(err => {
            console.error('polling error', err)
        })
    }

    private loadCallbacks() {
        const callbacksPath = path.join(__dirname, 'callbacks')

        const dir = readdirSync(callbacksPath)

        for (const file of dir) {
            const { default: callbackClass } = require(path.join(callbacksPath, file))

            if (callbackClass == undefined) continue;

            const callback: DefaultCallback = new callbackClass()

            if (callback.id == undefined) continue;

            if (Object.keys(this.callbacks).includes(callback.id)) throw new Error(`cmd id '${callback.id}' is already registred`)

            this.callbacks[callback.id] = callback
        }

        console.log(`[VK] Loaded ${Object.keys(this.callbacks).length} callbacks`)
    }

    private parseMessage(text?: string) {
        const hasMention = /\[(?:club|public)(\d+?)\|[\s\S]+?\],?\s([\s\S]*)/m.test(text || '')
        let [, parsedMentionId, mentionMessage] = text?.match(/\[(?:club|public)(\d+?)\|[\s\S]+?\],?\s([\s\S]*)/m) || []

        let mentionId: number = 0
        if (hasMention && !isNaN(+parsedMentionId)) {
            mentionId = Number(parsedMentionId);
        }

        let selfMention: boolean = false;
        if (hasMention && mentionId == config.vk.bot.id) {
            selfMention = true;
        }

        const outText: string | undefined = mentionMessage || text;

        return { text: outText, selfMention };
    }

    private messageHandler(context: MessageContext<ContextDefaultState>, next: NextMiddleware) {
        if (context.isFromGroup) return next();

        const { text, selfMention } = this.parseMessage(context.text);
        const _context = new VkCommandContext(context, this.input, this.cache, text);
        const chat = new VkChat(context.peerId);

        if (chat.ref === null) {
            chat.ref = context.referralValue?.slice(0, 255) || 'none'
        }

        if (!_context.payload && chat.accepted && this.input.has(String(context.peerId))) {
            return this.input.resolve(String(context.peerId), text);
        }

        let cmd: AbstractCommand | null = null;
        if (_context.payload) {
            cmd = CommandController.searchCommandByPayload(_context.payload.action || _context.payload, chat.scene)
        } else {
            cmd = CommandController.searchCommandByMessage(text, chat.scene)
        }

        this.handleMessage(cmd, {
            context: _context,
            chat: chat,
            actions: new VkBotAction(context, chat, this.input, this.cache),
            keyboard: new Keyboard(_context, chat.resync()),
            service: 'vk',
            realContext: context,
            scheduleFormatter: createScheduleFormatter('vk', raspCache, chat)
        }, {
            selfMention: selfMention
        })
    }

    protected _getAcceptKeyParams(context: VkCommandContext): InputRequestKey {
        return {
            from: FromType.VKBot,
            peer_id: context.peerId,
            sender_id: context.userId,
            time: Date.now()
        }
    }

    private eventHandler(context: MessageEventContext<ContextDefaultState>, next: NextMiddleware) {
        if (context.eventPayload?.action == undefined) return next();

        for (const id in this.callbacks) {
            const callback = this.callbacks[id]

            if (callback.action !== context.eventPayload?.action) continue;

            (async () => {
                try {
                    const chat = new VkChat(context.peerId)
                    if (!chat.accepted) return;

                    chat.lastMsgTime = Date.now()

                    await callback.handler({ context, chat })
                } catch (e: any) {
                    console.error(id, e)
                    this.vk.api.messages.send({
                        peer_id: context.peerId,
                        random_id: getRandomId(),
                        message: `Произошла ошибка во время выполнения Callback #${id}: ${e.toString()}`
                    })
                }
            })()

            return;
        }
    }

    private inviteUser(context: MessageContext<ContextDefaultState>, next: NextMiddleware) {
        if (context.eventMemberId != -config.vk.bot.id) return next();

        const chat = new VkChat(context.peerId)

        const _context = new VkCommandContext(context, this.input, this.cache);
        const keyboard = new Keyboard(_context, chat.resync())

        _context.send(defines['message.about'], {
            keyboard: keyboard.MainMenu,
            disable_mentions: true
        })
    }
}