import { NextMiddleware } from 'middleware-io';
import { APIError, CallbackQueryContext, ChatMemberContext, MessageContext, Telegram } from 'puregram';
import StatusCode from 'status-code-enum';
import { config } from '../../../../config';
import { FromType, InputRequestKey } from '../../../key';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils';
import { AbstractBot, AbstractCommandContext, DefaultCommand } from '../abstract';
import { CommandController } from '../command';
import { Keyboard } from '../keyboard';
import { TgBotAction } from './action';
import { TgChat } from './chat';
import { TgCommandContext } from './context';
import { TgEventListener } from './event';

export class TgBot extends AbstractBot {
    private static _instance?: TgBot;

    public tg: Telegram;

    public static get instance() {
        if (!this._instance) {
            this._instance = new this()
        }

        return this._instance
    }

    constructor() {
        super('tg')
        if (TgBot._instance) throw new Error('TgBot is singleton')

        this.tg = new Telegram({
            token: config.telegram.token,
        })

        this.tg.updates.on('message', (context, next) => this.messageHandler(context, next))
        this.tg.updates.on('my_chat_member', (context, next) => this.myChatMember(context, next))
        this.tg.updates.on('callback_query', (context, next) => this.callbackHandler(context, next))
        //this.tg.updates.on('my_chat_member', (context, next) => this.inviteUser(context, next))

        new TgEventListener(this.tg)
    }

    public async run() {
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

        const text = context.text
        const _context = new TgCommandContext(context, this.input, this.cache)
        const chat = new TgChat(context.chatId)
        chat.updateChat(context.chat, context.from);

        if (chat.ref === null) {
            chat.ref = context.startPayload || 'none'
        }

        if (context.text !== '/cancel' && chat.accepted && this.input.has(String(context.chatId))) {
            return this.input.resolve(String(context.chatId), text);
        }

        let cmd: DefaultCommand | null = null;
        if (context.text === '/cancel') {
            cmd = CommandController.searchCommandByPayload('cancel', chat.scene)
        } else {
            cmd = CommandController.searchCommandByMessage(text, chat.scene)
        }

        this.handleMessage(cmd, {
            context: _context,
            chat: chat,
            actions: new TgBotAction(context, chat, this.input, this.cache),
            keyboard: new Keyboard(_context, chat),
            service: 'tg',
            realContext: context,
            scheduleFormatter: createScheduleFormatter('tg', raspCache, chat)
        }, {
            isFromChat: context.isChannel() || context.isSupergroup() || context.isGroup()
        });
    }

    protected override handleMessageError(cmd: DefaultCommand, context: AbstractCommandContext, err: Error): void {
        if (err instanceof APIError && [StatusCode.ClientErrorTooManyRequests, StatusCode.ClientErrorForbidden].includes(err.code)) {
            return;
        }

        return super.handleMessageError(cmd, context, err);
    }

    private async callbackHandler(context: CallbackQueryContext, next: NextMiddleware) {
        if (context.from?.isBot()) return next();

        let payload: string | undefined = context.queryPayload as any;
        if (!payload || !context.message) {
            return;
        }

        const chat = new TgChat(context.from.id);

        if (payload === 'cancel') {
            this.input.cancel(String(context.message.chatId));
            chat.scene = null;

            // await context.message.editMessageReplyMarkup({
            //     inline_keyboard: []
            // }).catch(() => {});
            await context.answerCallbackQuery({
                text: 'Ввод был отменён'
            }).catch(() => { });

            await context.message.delete().catch(() => { });

            return;
        }
        
        if (payload.startsWith('answer:')) {
            const text: string = payload.replace(/answer:/i, '');

            await context.answerCallbackQuery({
                text: `Выбрано: "${text}"`
            }).catch(() => { });

            if (chat.accepted && this.input.has(String(context.message.chatId))) {
                this.input.resolve(String(context.message.chatId), text);

                await context.message.delete().catch(() => { });
            }

            return;
        }
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