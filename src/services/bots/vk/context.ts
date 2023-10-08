import { ContextDefaultState, MessageContext, VK } from "vk-io";
import { VkBot } from ".";
import { config } from "../../../../config";
import { ImageFile } from "../../image/builder";
import { AbstractCommandContext, FileCache, MessageOptions } from "../abstract";
import { BotInput } from "../input";
import { convertAbstractToVK } from "./keyboard";

export class VkCommandContext extends AbstractCommandContext {
    public id: string;
    public text: string
    public payload?: any;
    public peerId: number;
    public userId: number;

    private context: MessageContext<ContextDefaultState>;
    private vk: VK
    private cache: FileCache;

    private _isAdmin: boolean | undefined;

    constructor(context: MessageContext<ContextDefaultState>, input: BotInput, cache: FileCache, text?: string) {
        super(input)
        this.vk = VkBot.instance.vk
        this.context = context
        this.id = context.peerId.toString()
        this.text = text || context.text || ''
        this.cache = cache;

        //if (typeof context.messagePayload === 'object' && context.messagePayload.action != null) {
        this.payload = context.messagePayload
        //}

        this.peerId = context.peerId
        this.userId = context.senderId
    }

    get isChat(): boolean {
        return this.context.isChat
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to
        if (typeof reply_to === 'string') reply_to = Number(reply_to)

        const res = await this.context.send(text, {
            reply_to: reply_to,
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard)
        })

        return res.id.toString()
    }

    public async sendPhoto(image: ImageFile, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to
        if (typeof reply_to === 'string') reply_to = Number(reply_to)

        let attachment: string | null = this.cache.get(image.id);
        if (!attachment) {
            attachment = (await this.vk.upload.messagePhoto({
                source: {
                    value: await image.data()
                }
            })).toString();

            this.cache.add(image.id, attachment);
        }

        const res = await this.context.send('', {
            reply_to: reply_to,
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard),
            attachment: attachment ? [attachment] : undefined
        })

        return res.id.toString()
    }

    public async delete(id: string): Promise<boolean> {
        return this.context.deleteMessage({
            message_ids: Number(id),
            delete_for_all: 1,
        })
    }

    public async isChatAdmin(): Promise<boolean> {
        if (this._isAdmin !== undefined) return this._isAdmin

        const res = (await this.vk.api.messages.getConversationsById({ peer_ids: this.context.peerId })).items?.[0]

        if (res?.peer.type != 'chat') {
            this._isAdmin = false
            return false;
        }

        if (!res.chat_settings.admin_ids.includes(-config.vk.bot.id)) {
            this._isAdmin = false
            return false;
        }

        this._isAdmin = true

        return true;
    }
}