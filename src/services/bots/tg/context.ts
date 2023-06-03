import { MediaInput, MediaSourceType, MessageContext, PhotoAttachment, Telegram } from "puregram";
import { TgBot } from ".";
import { ImageFile } from "../../image/builder";
import { AbstractCommandContext, FileCache, MessageOptions } from "../abstract";
import { BotInput } from "../input";
import { StaticKeyboard } from "../keyboard";
import { convertAbstractToTg } from "./keyboard";

export class TgCommandContext extends AbstractCommandContext {
    public id: string;
    public text: string
    public payload = undefined;
    public peerId: number;
    public userId: number;

    private context: MessageContext;
    private tg: Telegram;

    private _isAdmin: boolean | undefined;
    private cache: FileCache;

    constructor(context: MessageContext, input: BotInput, cache: FileCache) {
        super(input)
        this.tg = TgBot.instance.tg
        this.context = context
        this.id = context.chatId.toString()
        this.text = context.text || ''

        this.cache = cache;

        /*if (typeof context.messagePayload === 'object' && context.messagePayload.action != null) {
            this.payload = context.messagePayload
        }*/

        this.peerId = context.chat.id;
        this.userId = context.from?.id || 0;
    }

    get isChat(): boolean {
        return this.context.isGroup()
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to
        if (typeof reply_to === 'string') reply_to = Number(reply_to)

        if (options?.keyboard?.name === StaticKeyboard.Cancel.name) {
            text += '\n\nНапишите /cancel для отмены';
            delete options.keyboard;
        }

        const result: MessageContext = await this.context.send(text, {
            reply_to_message_id: reply_to,
            disable_notification: options.disable_mentions,
            reply_markup: convertAbstractToTg(options.keyboard)
        });

        return result.id.toString();
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

    public async isAdmin(): Promise<boolean> {
        return false;
        //TO DO
        /*if (this._isAdmin !== undefined) return this._isAdmin

        const res = (await this.vk.api.messages.getConversationsById({ peer_ids: this.context.peerId })).items[0]

        if (res?.peer.type != 'chat') {
            this._isAdmin = false
            return false;
        }

        if (!res.chat_settings.admin_ids.includes(-config.vk.bot.id)) {
            this._isAdmin = false
            return false;
        }

        this._isAdmin = true

        return true;*/
    }
}