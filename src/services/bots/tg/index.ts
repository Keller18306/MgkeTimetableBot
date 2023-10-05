import { NextMiddleware } from 'middleware-io';
import { APIError, CallbackQueryContext, ChatMemberContext, MediaInput, MediaSourceType, MessageContext, PhotoAttachment, Telegram } from 'puregram';
import StatusCode from 'status-code-enum';
import { config } from '../../../../config';
import { FromType, InputRequestKey } from '../../../key';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils';
import { ImageBuilder, ImageFile } from '../../image/builder';
import { AbstractBot, AbstractCommand, AbstractCommandContext } from '../abstract';
import { CommandController } from '../controller';
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
            token: config.telegram.token
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

        let cmd: AbstractCommand | null = null;
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

        let payload: any = context.queryPayload;
        if (!payload || !context.message) {
            return;
        }

        const chat = new TgChat(context.from.id);
        
        //todo rewrite to abstract for all services
        if (typeof payload === 'object') {
            switch (payload.action) {
                case 'answer':
                    const answer: string = payload.answer;
                    if (!answer) return;

                    await context.answerCallbackQuery({
                        text: `Выбрано: "${answer}"`
                    }).catch(() => { });

                    if (chat.accepted && this.input.has(String(context.message.chatId))) {
                        this.input.resolve(String(context.message.chatId), answer);

                        await context.message.delete().catch(() => { });
                    }

                    return;
                
                case 'image':
                    const type: string = payload.type;
                    const value: string = payload.value;
                    if (!type || !value) return;

                    let image: ImageFile | undefined;
                    if (type === 'group') {
                        const rasp = raspCache.groups.timetable[value];
                        if (!rasp) return;

                        image = await ImageBuilder.getGroupImage(rasp);
                    } else if (type === 'teacher') {
                        const rasp = raspCache.teachers.timetable[value];
                        if (!rasp) return;

                        image = await ImageBuilder.getTeacherImage(rasp);
                    }

                    if (!image) return;

                    let fileId = this.cache.get(image.id);

                    let photo: MediaInput;
                    if (fileId) {
                        photo = {
                            type: MediaSourceType.FileId,
                            value: fileId
                        }
                    } else {
                        photo = {
                            type: MediaSourceType.Buffer,
                            value: await image.data()
                        }
                    }

                    const result: MessageContext = await context.message.sendPhoto(photo, {
                        reply_to_message_id: context.message.id
                    });

                    const attachment = result.attachment;
                    if (!fileId && attachment instanceof PhotoAttachment) {
                        fileId = attachment.bigSize.fileId;

                        this.cache.add(image.id, fileId);
                    }

                    return context.answerCallbackQuery({
                        text: 'Изображение было отправлено'
                    }).catch(() => {});
            }
        } else if (payload === 'cancel') {
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
        } else {
            
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