import { NextMiddleware } from 'middleware-io';
import { ContextDefaultState, MessageContext, MessageEventContext, MessageSubscriptionContext, VK } from 'vk-io';
import { config } from '../../../../config';
import { App, AppService } from '../../../app';
import { defines } from '../../../defines';
import { createScheduleFormatter } from '../../../utils';
import { FromType, InputRequestKey } from '../../key';
import { raspCache } from '../../parser';
import { AbstractBot, AbstractCommand } from '../abstract';
import { AbstractBotEventListener } from '../events';
import { Keyboard } from '../keyboard';
import { VkBotAction } from './action';
import { VkChat } from './chat';
import { VkCallbackContext, VkCommandContext } from './context';
import { VkEventListener } from './event';

export class VkBot extends AbstractBot implements AppService {
    public vk: VK;
    public event: AbstractBotEventListener;

    constructor(app: App) {
        super(app, 'vk');

        this.vk = new VK({
            pollingGroupId: config.vk.bot.id,
            token: config.vk.bot.access_token
        });

        this.event = new VkEventListener(this.app, this.vk);
    }

    public async run() {
        this.vk.updates.on('message_new', (context, next) => this.messageHandler(context, next))
        this.vk.updates.on('message_event', (context, next) => this.eventHandler(context, next))
        this.vk.updates.on('chat_invite_user', (context, next) => this.inviteUser(context, next))
        this.vk.updates.on('message_allow', (context, next) => this.setAllowSendMess(context, next, true))
        this.vk.updates.on('message_deny', (context, next) => this.setAllowSendMess(context, next, false))

        await this.vk.api.groups.setLongPollSettings({
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

        if (config.vk.bot.noticer) {
            this.getBotService().events.registerListener(this.event);
        }        

        await this.getBotService().init();

        await this.vk.updates.startPolling().then(() => {
            console.log('[VK Bot] Start polling...')
        }).catch(err => {
            console.error('polling error', err)
        });
    }
    
    public getChat(peerId: number): VkChat {
        return new VkChat(peerId);
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
        const _context = new VkCommandContext(this.vk, context, this.app, this.input, this.cache, text);
        const chat = this.getChat(context.peerId);

        if (chat.ref === null) {
            chat.ref = context.referralValue?.slice(0, 255) || 'none';
        }

        let cmd: AbstractCommand | null = null;
        if (context.messagePayload) {
            cmd = this.getBotService().searchCommandByPayload(context.messagePayload, chat.scene);
        }

        if (!cmd) {
            cmd = this.getBotService().searchCommandByMessage(text, chat.scene);
        }

        if (!cmd && chat.accepted && this.input.has(String(context.peerId))) {
            return this.input.resolve(String(context.peerId), text, 'message');
        }

        this.handleMessage(cmd, {
            service: 'vk',
            context: _context,
            chat: chat,
            actions: new VkBotAction(this.vk, context, chat, this.app, this.input, this.cache),
            keyboard: new Keyboard(this.app, chat.resync(), _context),
            realContext: context,
            scheduleFormatter: createScheduleFormatter('vk', this.app, raspCache, chat),
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

        const chat = this.getChat(context.peerId);

        const cb = this.getBotService().getCallbackByPayload(payload);
        if (!cb) return;

        const _context = new VkCallbackContext(this.vk, context, this.app, this.input, this.cache);

        return this.handleCallback(cb, {
            service: 'vk',
            context: _context,
            realContext: context,
            chat: chat,
            keyboard: new Keyboard(this.app, chat, _context),
            scheduleFormatter: createScheduleFormatter('vk', this.app, raspCache, chat),
            cache: this.cache
        });
    }

    private inviteUser(context: MessageContext<ContextDefaultState>, next: NextMiddleware) {
        if (context.eventMemberId != -config.vk.bot.id) return next();

        const chat = this.getChat(context.peerId);

        const _context = new VkCommandContext(this.vk, context, this.app, this.input, this.cache);
        const keyboard = new Keyboard(this.app, chat.resync(), _context);

        return _context.send(defines['vk.message.about'], {
            keyboard: keyboard.MainMenu,
            disable_mentions: true
        });
    }

    private setAllowSendMess(context: MessageSubscriptionContext<ContextDefaultState>, next: NextMiddleware, status: boolean) {
        const chat = this.getChat(context.userId);

        chat.allowSendMess = status;
    }
}