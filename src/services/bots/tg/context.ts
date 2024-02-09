import { CallbackQueryContext, MediaInput, MediaSourceType, MessageContext, PhotoAttachment } from "puregram";
import { config } from "../../../../config";
import { App } from "../../../app";
import { parsePayload } from "../../../utils";
import { ImageFile } from "../../image/builder";
import { AbstractCallbackContext, AbstractCommandContext, MessageOptions, ServiceStorage } from "../abstract";
import { BotInput } from "../input";
import { StaticKeyboard } from "../keyboard";
import { convertAbstractToTg } from "./keyboard";

export class TgCommandContext extends AbstractCommandContext {
    public text: string;
    public payload = undefined;
    public peerId: number;
    public userId: number;

    protected lastSentMessageId?: number;

    private context: MessageContext;
    private cache: ServiceStorage;

    constructor(context: MessageContext, app: App, input: BotInput, cache: ServiceStorage) {
        super(app, input)
        this.context = context
        this.text = context.text || ''

        this.cache = cache;

        /*if (typeof context.messagePayload === 'object' && context.messagePayload.action != null) {
            this.payload = context.messagePayload
        }*/

        this.peerId = context.chat.id;
        this.userId = context.from?.id || 0;
    }

    get isChat(): boolean {
        return this.context.isChannel() || this.context.isSupergroup() || this.context.isGroup();
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        if (options?.keyboard?.name === StaticKeyboard.Cancel.name) {
            text += '\n\nНапишите /cancel для отмены';
            delete options.keyboard;
        }

        const result: MessageContext = await this.context.send(text, {
            ...(!options.disableHtmlParser ? {
                parse_mode: 'HTML',
            } : {}),
            ...(reply_to ? {
                allow_sending_without_reply: true,
                reply_to_message_id: reply_to,
            } : {}),
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        });

        this.lastSentMessageId = result.id;

        return result.id.toString();
    }

    public async editOrSend(text: string, options: MessageOptions = {}): Promise<boolean> {
        if (!this.lastSentMessageId) {
            const result = await this.send(text, options);

            return Boolean(result);
        }

        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        if (options?.keyboard?.name === StaticKeyboard.Cancel.name) {
            text += '\n\nНапишите /cancel для отмены';
            delete options.keyboard;
        }

        const result = await this.context.editMessageText(text, {
            message_id: this.lastSentMessageId,
            
            ...(!options.disableHtmlParser ? {
                parse_mode: 'HTML',
            } : {}),
            ...(reply_to ? {
                allow_sending_without_reply: true,
                reply_to_message_id: reply_to,
            } : {}),
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        });

        return Boolean(result);
    }

    public async sendPhoto(image: ImageFile, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to
        if (typeof reply_to === 'string') reply_to = Number(reply_to)

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

        const result: MessageContext = await this.context.sendPhoto(photo, {
            reply_to_message_id: reply_to,
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        });

        const attachment = result.attachment;
        if (!fileId && attachment instanceof PhotoAttachment) {
            fileId = attachment.bigSize.fileId;

            this.cache.add(image.id, fileId);
        }

        return result.id.toString();
    }

    public async delete(id: string): Promise<boolean> {
        return this.context.delete({
            message_id: Number(id)
        })
    }

    public async isChatAdmin(): Promise<boolean> {
        return false;
        //TO DO
    }
}

export class TgCallbackContext extends AbstractCallbackContext {
    public messageId: any;
    public payload: any;
    public peerId: number;
    public userId: number;

    private context: CallbackQueryContext;
    private messageContext: MessageContext;

    private cache: ServiceStorage;

    constructor(context: CallbackQueryContext, app: App, input: BotInput, cache: ServiceStorage) {
        super(app, input)

        this.context = context;

        if (!context.message) {
            throw new Error('there are no message context');
        }

        this.messageContext = context.message;
        this.messageId = context.message.id;

        this.cache = cache;

        /*if (typeof context.messagePayload === 'object' && context.messagePayload.action != null) {
            this.payload = context.messagePayload
        }*/

        this.peerId = context.message!.chat.id;
        this.userId = context.from.id;

        const json = parsePayload(context.data);
        if (json) {
            this.payload = json.data;
        }
    }

    get isChat(): boolean {
        return this.messageContext.isChannel() || this.messageContext.isSupergroup() || this.messageContext.isGroup();
    }

    public async answer(text: string): Promise<boolean> {
        return this.context.answerCallbackQuery({
            text: text
        })
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to
        if (typeof reply_to === 'string') reply_to = Number(reply_to)

        if (options?.keyboard?.name === StaticKeyboard.Cancel.name) {
            text += '\n\nНапишите /cancel для отмены';
            delete options.keyboard;
        }

        const result: MessageContext = await this.messageContext.send(text, {
            ...(!options.disableHtmlParser ? {
                parse_mode: 'HTML',
            } : {}),
            ...(reply_to ? {
                allow_sending_without_reply: true,
                reply_to_message_id: reply_to,
            } : {}),
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        });

        return result.id.toString();
    }

    public async edit(text: string, options: MessageOptions = {}) {
        await this.messageContext.editMessageText(text, {
            ...(!options.disableHtmlParser ? {
                parse_mode: 'HTML',
            } : {}),
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        })

        return true;
    }

    public async sendPhoto(image: ImageFile, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to
        if (typeof reply_to === 'string') reply_to = Number(reply_to)

        let fileId = this.cache.get(image.id);

        let photo: MediaInput;
        if (!config.dev && fileId) {
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

        const result: MessageContext = await this.messageContext.sendPhoto(photo, {
            reply_to_message_id: reply_to,
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        });

        const attachment = result.attachment;
        if (!fileId && attachment instanceof PhotoAttachment) {
            fileId = attachment.bigSize.fileId;

            this.cache.add(image.id, fileId);
        }

        return result.id.toString();
    }

    public async delete(id?: string): Promise<boolean> {
        return this.messageContext.delete({
            message_id: id ? Number(id) : this.messageContext.id
        })
    }

    public async isChatAdmin(): Promise<boolean> {
        return false;
        //TO DO
    }
}