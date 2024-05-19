import { CallbackQueryContext, MediaInput, MediaSourceType, MessageContext, PhotoAttachment } from "puregram";
import { TgBot } from ".";
import { config } from "../../../../config";
import { ParsedPayload, parsePayload } from "../../../utils";
import { ImageFile } from "../../image/builder";
import { AbstractCallbackContext, AbstractCommandContext, MessageOptions } from "../abstract";
import { StaticKeyboard } from "../keyboard";
import { convertAbstractToTg } from "./keyboard";

export class TgCommandContext extends AbstractCommandContext {
    public text: string;
    public parsedPayload: undefined;
    public peerId: number;
    public userId: number;

    public messageId?: number;

    private context: MessageContext;

    constructor(bot: TgBot, context: MessageContext) {
        super(bot);

        this.context = context;
        this.text = context.text || '';

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

        this.messageId = result.id;

        return result.id.toString();
    }

    public async editOrSend(text: string, options: MessageOptions = {}): Promise<boolean> {
        if (!this.messageId) {
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
            message_id: this.messageId,

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

        let fileId = await this.cache.get(image.id);

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

            await this.cache.add(image.id, fileId);
        }

        return result.id.toString();
    }

    public async delete(id?: string): Promise<boolean> {
        if (!id && !this.messageId) {
            throw new Error('the are no message to delete');
        }

        return this.context.delete({
            message_id: id ? Number(id) : this.messageId
        })
    }

    public async isChatAdmin(): Promise<boolean> {
        return false;
        //TO DO
    }
}

export class TgCallbackContext extends AbstractCallbackContext {
    public peerId: number;
    public userId: number;
    public messageId: number;
    public callbackAnswered: boolean = false;
    public parsedPayload?: ParsedPayload;

    private context: CallbackQueryContext;
    private messageContext: MessageContext;

    constructor(bot: TgBot, context: CallbackQueryContext) {
        super(bot);

        this.context = context;

        if (!context.message) {
            throw new Error('there are no message context');
        }

        this.messageContext = context.message;
        this.messageId = context.message.id;

        this.peerId = context.message!.chat.id;
        this.userId = context.from.id;

        this.parsedPayload = parsePayload(context.data);
    }

    get isChat(): boolean {
        return this.messageContext.isChannel() || this.messageContext.isSupergroup() || this.messageContext.isGroup();
    }

    public async answer(text?: string): Promise<boolean> {
        this.callbackAnswered = true;

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

    public async editOrSend(text: string, options: MessageOptions = {}) {
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

        let fileId = await this.cache.get(image.id);

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

            await this.cache.add(image.id, fileId);
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
        // TODO
    }
}