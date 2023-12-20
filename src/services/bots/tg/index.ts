import { NextMiddleware } from 'middleware-io';
import { APIError, CallbackQueryContext, ChatMemberContext, MessageContext, Telegram } from 'puregram';
import StatusCode from 'status-code-enum';
import { config } from '../../../../config';
import { FromType, InputRequestKey } from '../../../key';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils';
import { AbstractBot, AbstractCommand, AbstractCommandContext } from '../abstract';
import { CommandController } from '../controller';
import { Keyboard } from '../keyboard';
import { TgBotAction } from './action';
import { TgChat } from './chat';
import { TgCallbackContext, TgCommandContext } from './context';
import { TgEventListener } from './event';

export class TgBot extends AbstractBot {
    public tg: Telegram;

    constructor() {
        super('tg');

        this.tg = new Telegram({
            token: config.telegram.token
        });

        this.tg.updates.on('message', (context, next) => this.messageHandler(context, next))
        this.tg.updates.on('my_chat_member', (context, next) => this.myChatMember(context, next))
        this.tg.updates.on('callback_query', (context, next) => this.callbackHandler(context, next))
        //this.tg.updates.on('my_chat_member', (context, next) => this.inviteUser(context, next))

        new TgEventListener(this.tg)
    }

    public async run() {
        await CommandController.instance.init();

        await this.tg.updates.startPolling().then(() => {
            console.log('[Telegram Bot] Start polling...')
        }).catch(err => {
            console.error('polling error', err)
        })

        this.setBotCommands()
    }

    private async setBotCommands() {
        const cmd_promises: Promise<boolean>[] = []
        cmd_promises.push(this.tg.api.setMyCommands({
            commands: CommandController.getBotCommands(),
            scope: {
                type: 'default'
            }
        }))

        const adminCommands = CommandController.getBotCommands(true);
        for (const admin_id of config.telegram.admin_ids) {
            const promise = this.tg.api.setMyCommands({
                commands: adminCommands,
                scope: {
                    type: 'chat',
                    chat_id: admin_id
                }
            })

            cmd_promises.push(promise)
        }

        const result = await Promise.all(cmd_promises);

        console.log('[Telegram Bot] Commands finnaly set');

        return result;
    }

    private messageHandler(context: MessageContext, next: NextMiddleware) {
        if (context.from?.isBot() || context.hasViaBot()) return next();

        const text = context.text;
        const _context = new TgCommandContext(context, this.input, this.cache);
        const chat = new TgChat(context.chatId);
        chat.updateChat(context.chat, context.from);

        if (chat.ref === null) {
            chat.ref = context.startPayload || 'none';
        }

        let cmd: AbstractCommand | null = CommandController.searchCommandByMessage(text, chat.scene);
        if (!cmd && chat.accepted && this.input.has(String(context.chatId))) {
            return this.input.resolve(String(context.chatId), text, 'message');
        }

        this.handleMessage(cmd, {
            context: _context,
            chat: chat,
            actions: new TgBotAction(context, chat, this.input, this.cache),
            keyboard: new Keyboard(_context, chat),
            service: 'tg',
            realContext: context,
            scheduleFormatter: createScheduleFormatter('tg', raspCache, chat),
            cache: this.cache
        });
    }

    protected override handleMessageError(cmd: AbstractCommand, context: AbstractCommandContext, err: Error): void {
        if (err instanceof APIError && [StatusCode.ClientErrorTooManyRequests, StatusCode.ClientErrorForbidden].includes(err.code)) {
            return;
        }

        return super.handleMessageError(cmd, context, err);
    }

    private async callbackHandler(context: CallbackQueryContext, next: NextMiddleware) {
        if (context.from?.isBot()) return next();

        let payload: string | undefined = context.data;
        if (!payload || !context.message) {
            return;
        }

        const chat = new TgChat(context.from.id);
        chat.updateChat(context.message.chat, context.message.from);

        const cb = CommandController.getCallbackByPayload(payload);
        if (!cb) return;

        const _context = new TgCallbackContext(context, this.input, this.cache);

        return this.handleCallback(cb, {
            service: 'tg',
            context: _context,
            realContext: context,
            chat: chat,
            keyboard: new Keyboard(_context, chat),
            scheduleFormatter: createScheduleFormatter('tg', raspCache, chat),
            cache: this.cache
        });
    }

    protected _getAcceptKeyParams(context: TgCommandContext): InputRequestKey {
        return {
            from: FromType.VKBot,
            peer_id: context.peerId,
            sender_id: context.userId,
            time: Date.now()
        }
    }

    private myChatMember(context: ChatMemberContext, next: NextMiddleware) {
        const chat = new TgChat(context.chatId);

        if (context.newChatMember.status === 'kicked') {
            chat.allowSendMess = false
            return;
        }

        if (context.newChatMember.status === 'member') {
            chat.allowSendMess = true
        }
    }

    private inviteUser(context: ChatMemberContext, next: NextMiddleware) {
        console.log(context)
        //if (context) return next();

        /*const chat = new TgChat(context.peerId)

        const adv_context: AdvancedContext = {
            hasMention: false,
            mentionId: 0,
            mentionMessage: '',
            selfMention: false
        }

        const keyboard = new TgKeyboard(context, chat.resync(), adv_context)

        context.send(defines['message.about'], {
            keyboard: keyboard.MainMenu,
            disable_mentions: true
        })*/
    }
}