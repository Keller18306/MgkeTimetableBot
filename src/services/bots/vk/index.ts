import { NextMiddleware } from 'middleware-io';
import { ContextDefaultState, MessageContext, MessageEventContext, MessageSubscriptionContext, VK } from 'vk-io';
import { config } from '../../../../config';
import { defines } from '../../../defines';
import { FromType, InputRequestKey } from '../../../key';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils';
import { AbstractBot, AbstractCommand } from '../abstract';
import { CommandController } from '../controller';
import { Keyboard } from '../keyboard';
import { VkBotAction } from './action';
import { VkChat } from './chat';
import { VkCallbackContext, VkCommandContext } from './context';
import { VkEventListener } from './event';

export class VkBot extends AbstractBot {
    private static _instance?: VkBot;

    public vk: VK;

    public static get instance() {
        if (!this._instance) {
            this._instance = new this()
        }

        return this._instance
    }

    constructor() {
        super('vk');
        if (VkBot._instance) throw new Error('VkBot is singleton');

        this.vk = new VK({
            pollingGroupId: config.vk.bot.id,
            token: config.vk.bot.access_token
        });

        this.vk.updates.on('message_new', (context, next) => this.messageHandler(context, next))
        this.vk.updates.on('message_event', (context, next) => this.eventHandler(context, next))
        this.vk.updates.on('chat_invite_user', (context, next) => this.inviteUser(context, next))
        this.vk.updates.on('message_allow', (context, next) => this.setAllowSendMess(context, next, true))
        this.vk.updates.on('message_deny', (context, next) => this.setAllowSendMess(context, next, false))

        this.vk.api.groups.setLongPollSettings({
            group_id: config.vk.bot.id,
            enabled: true,

            message_new: true,
            message_event: true,
            message_allow: true,
            message_deny: true,

            group_join: true,
            group_leave: true,

            api_version: this.vk.api.options.apiVersion
        }).then(() => {
            console.log('[VK Bot] Settings set up')
        });

        new VkEventListener(this.vk);
    }

    public run() {
        this.vk.updates.startPolling().then(() => {
            console.log('[VK Bot] Start polling...')
        }).catch(err => {
            console.error('polling error', err)
        });
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
            chat.ref = context.referralValue?.slice(0, 255) || 'none';
        }

        let cmd: AbstractCommand | null = null;
        if (context.messagePayload) {
            cmd = CommandController.searchCommandByPayload(context.messagePayload, chat.scene);
        }

        if (!cmd) {
            cmd = CommandController.searchCommandByMessage(text, chat.scene);
        }

        if (!cmd && chat.accepted && this.input.has(String(context.peerId))) {
            return this.input.resolve(String(context.peerId), text, 'message');
        }

        this.handleMessage(cmd, {
            context: _context,
            chat: chat,
            actions: new VkBotAction(context, chat, this.input, this.cache),
            keyboard: new Keyboard(_context, chat.resync()),
            service: 'vk',
            realContext: context,
            scheduleFormatter: createScheduleFormatter('vk', raspCache, chat),
            cache: this.cache
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
        if (!context.eventPayload) return next();

        let payload: string | undefined = context.eventPayload;
        if (!payload || typeof payload !== 'string') {
            return;
        }

        const chat = new VkChat(context.peerId);

        const cb = CommandController.getCallbackByPayload(payload);
        if (!cb) return;

        const _context = new VkCallbackContext(context, this.input, this.cache);

        return this.handleCallback(cb, {
            service: 'vk',
            context: _context,
            realContext: context,
            chat: chat,
            keyboard: new Keyboard(_context, chat),
            scheduleFormatter: createScheduleFormatter('vk', raspCache, chat),
            cache: this.cache
        });
    }

    private inviteUser(context: MessageContext<ContextDefaultState>, next: NextMiddleware) {
        if (context.eventMemberId != -config.vk.bot.id) return next();

        const chat = new VkChat(context.peerId);

        const _context = new VkCommandContext(context, this.input, this.cache);
        const keyboard = new Keyboard(_context, chat.resync());

        return _context.send(defines['vk.message.about'], {
            keyboard: keyboard.MainMenu,
            disable_mentions: true
        });
    }

    private setAllowSendMess(context: MessageSubscriptionContext<ContextDefaultState>, next: NextMiddleware, status: boolean) {
        const chat = new VkChat(context.userId);

        chat.allowSendMess = status;
    }
}