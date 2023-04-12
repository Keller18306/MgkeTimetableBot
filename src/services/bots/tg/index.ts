import { NextMiddleware } from 'middleware-io';
import { APIError, CallbackQueryContext, ChatMemberContext, MessageContext, Telegram } from 'puregram';
import StatusCode from 'status-code-enum';
import { config } from '../../../../config';
import { FromType, InputRequestKey } from '../../../key';
import { AbstractBot } from '../abstract/bot';
import { AdvancedContext, DefaultCommand, HandlerParams } from '../abstract/command';
import { FileCache } from '../abstract/fileCache';
import { CommandController } from '../command';
import { InputCancel } from '../input';
import { Keyboard } from '../keyboard';
import { TgBotAction } from './action';
import { TgChat } from './chat';
import { TgCommandContext } from './context';
import { TgEventListener } from './event';

export class TgBot extends AbstractBot<TgCommandContext> {
    private static _instance?: TgBot;

    public tg: Telegram;

    protected cache: FileCache;

    public static get instance() {
        if (!this._instance) {
            this._instance = new this()
        }

        return this._instance
    }

    constructor() {
        super()
        if (TgBot._instance) throw new Error('TgBot is singleton')

        this.tg = new Telegram({
            token: config.telegram.token,
        })

        this.cache = new FileCache('tg.json');

        this.tg.updates.on('message', (context, next) => this.messageHandler(context, next))
        this.tg.updates.on('my_chat_member', (context, next) => this.myChatMember(context, next))
        //this.tg.updates.on('my_chat_member', (context, next) => this.inviteUser(context, next))
        //this.tg.updates.on('callback_query', (context, next) => this.callbackHandler(context, next))

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

        const selfMention = true;

        const adv_context: AdvancedContext = {
            hasMention: false,
            mentionId: 0,
            mentionMessage: '',
            selfMention: selfMention
        }

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

        const keyboard = new Keyboard(_context, chat)
        if (chat.accepted && chat.needUpdateButtons) {
            chat.needUpdateButtons = false;
            chat.scene = null;
            _context.send('Клавиатура была принудительно пересоздана (обновлена)', {
                keyboard: keyboard.MainMenu
            });
        }

        let cmd: DefaultCommand | null = null;

        if (context.text === '/cancel') {
            cmd = CommandController.searchCommandByPayload('cancel', chat.scene)
        } else {
            cmd = CommandController.searchCommandByMessage(text, chat.scene)
        }

        if (!cmd) {
            if (selfMention || !(context.isChannel() || context.isGroup())) {
                if (chat.accepted) {
                    return this.notFound(_context, keyboard.MainMenu, selfMention)
                } else {
                    return this.notAccepted(_context)
                }
            }

            return;
        }

        if (cmd.adminOnly && !chat.isAdmin) {
            return this.notFound(_context, keyboard.MainMenu, selfMention);
        }

        if (!cmd.services.includes('tg')) {
            return this.notFound(_context, keyboard.MainMenu, selfMention);
        }

        (async () => {
            try {
                if (cmd.acceptRequired && !chat.accepted) {
                    if (context.isGroup() || context.isChannel() && !selfMention) return;

                    return this.notAccepted(_context)
                }

                chat.lastMsgTime = Date.now()

                const params: HandlerParams = {
                    context: _context,
                    adv_context,
                    chat: chat,
                    chatData: chat.resync(),
                    actions: new TgBotAction(context, chat, this.input, this.cache),
                    keyboard,
                    service: 'tg',
                    realContext: context
                }

                if (!cmd.preHandle(params)) return this.notFound(_context, keyboard.MainMenu, selfMention);

                await cmd.handler(params)
            } catch (e: any) {
                if (e instanceof InputCancel) return;
                console.error(cmd.id, chat.peerId, e)

                if (e instanceof APIError) {
                    if ([StatusCode.ClientErrorTooManyRequests, StatusCode.ClientErrorForbidden].includes(e.code)) {
                        return;
                    }
                }

                context.send(`Произошла ошибка во время выполнения Command #${cmd.id}: ${e.toString()}`).catch(() => {})
            }
        })()
    }

    private callbackHandler(context: CallbackQueryContext, next: NextMiddleware) {
        if (context.from?.isBot()) return next();

        let payload: { [key: string]: any };
        if (context.data) {
            payload = context.queryPayload as any;

            if (typeof payload !== 'object' || payload.action == null) {
                return;
            }
        } else {
            return;
        }

        const chat = new TgChat(context.from.id)
        //const keyboard = new TgKeyboard(context)


    }

    protected _getAcceptKeyParams(context: TgCommandContext): InputRequestKey {
        return {
            from: FromType.VKBot,
            peer_id: context.peerId,
            sender_id: context.userId,
            time: Date.now()
        }
    }

    private myChatMember(context: ChatMemberContext, need: NextMiddleware) {
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