import { ContextDefaultState, MessageContext, MessageEventContext, VK, getRandomId } from "vk-io";
import { VkBot } from ".";
import { config } from "../../../../config";
import { ParsedPayload, parsePayload } from "../../../utils";
import { ImageFile } from "../../image/builder";
import { AbstractCallbackContext, AbstractCommandContext, MessageOptions } from "../abstract";
import { convertAbstractToVK } from "./keyboard";

export class VkCommandContext extends AbstractCommandContext {
    public text: string;
    public parsedPayload?: ParsedPayload;
    public peerId: number;
    public userId: number;

    public messageId?: number;

    private context: MessageContext<ContextDefaultState>;
    private vk: VK;

    private _isAdmin: boolean | undefined;

    constructor(bot: VkBot, context: MessageContext<ContextDefaultState>, text?: string) {
        super(bot);

        this.vk = bot.vk;
        this.context = context;
        this.text = text || context.text || '';

        this.peerId = context.peerId;
        this.userId = context.senderId;
        this.messageId = context.conversationMessageId;

        this.parsedPayload = parsePayload(context.messagePayload);
    }

    get isChat(): boolean {
        return this.context.isChat;
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        const res = await this.context.send(text, {
            reply_to: reply_to,
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard)
        });

        this.messageId = res.id;

        return res.id.toString();
    }

    public async editOrSend(text: string, options: MessageOptions = {}): Promise<boolean> {
        if (!this.messageId) {
            const result = await this.send(text, options);

            return Boolean(result);
        }

        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        const res = await this.vk.api.messages.edit({
            message_id: this.messageId,
            peer_id: this.peerId,
            message: text,
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard)
        });

        return Boolean(res);
    }

    public async sendPhoto(image: ImageFile, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

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
        });

        return res.id.toString();
    }

    public async delete(id: string): Promise<boolean> {
        return this.context.deleteMessage({
            cmids: Number(id),
            delete_for_all: 1
        });
    }

    public async isChatAdmin(): Promise<boolean> {
        if (this._isAdmin !== undefined) return this._isAdmin;

        const res = (await this.vk.api.messages.getConversationsById({ peer_ids: this.context.peerId })).items?.[0];

        if (res?.peer.type != 'chat') {
            this._isAdmin = false;
            return false;
        }

        if (!res.chat_settings.admin_ids.includes(-config.vk.bot.id)) {
            this._isAdmin = false;
            return false;
        }

        this._isAdmin = true;

        return true;
    }
}

export class VkCallbackContext extends AbstractCallbackContext {
    public peerId: number;
    public userId: number;
    public messageId: number;
    public parsedPayload?: ParsedPayload;

    private context: MessageEventContext<ContextDefaultState>;
    private vk: VK;

    private _isAdmin: boolean | undefined;

    constructor(bot: VkBot, context: MessageEventContext<ContextDefaultState>) {
        super(bot);

        this.vk = bot.vk;
        this.context = context;

        this.peerId = context.peerId;
        this.userId = context.senderId;
        this.messageId = context.conversationMessageId;

        this.parsedPayload = parsePayload(context.eventPayload);
    }

    get isChat(): boolean {
        return this.context.peerId > 2e9;
    }

    public async answer(text: string): Promise<boolean> {
        const res = await this.context.answer({
            type: 'show_snackbar',
            text: text
        });

        return Boolean(res);
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        const res = await this.vk.api.messages.send({
            peer_id: this.peerId,
            random_id: getRandomId(),
            message: text,
            ...(reply_to ? {
                forward: JSON.stringify({
                    peer_id: this.peerId,
                    conversation_message_ids: reply_to,
                    is_reply: true
                })
            } : {}),
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard)
        });

        return res.toString();
    }

    public async editOrSend(text: string, options: MessageOptions = {}): Promise<boolean> {
        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        const res = await this.vk.api.messages.edit({
            conversation_message_id: this.context.conversationMessageId,
            peer_id: this.peerId,
            message: text,
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard)
        });

        return Boolean(res);
    }

    public async sendPhoto(image: ImageFile, options: MessageOptions = {}): Promise<string> {
        let reply_to: number | string | undefined = options.reply_to;
        if (typeof reply_to === 'string') reply_to = Number(reply_to);

        let attachment: string | null = this.cache.get(image.id);
        if (!attachment) {
            attachment = (await this.vk.upload.messagePhoto({
                source: {
                    value: await image.data()
                }
            })).toString();

            this.cache.add(image.id, attachment);
        }

        const res = await this.vk.api.messages.send({
            peer_id: this.peerId,
            random_id: getRandomId(),
            message: '',
            ...(reply_to ? {
                forward: JSON.stringify({
                    peer_id: this.peerId,
                    conversation_message_ids: reply_to,
                    is_reply: true
                })
            } : {}),
            disable_mentions: options.disable_mentions,
            keyboard: convertAbstractToVK(options.keyboard),
            attachment: attachment ? [attachment] : undefined
        });

        return res.toString();
    }

    public async delete(id?: string): Promise<boolean> {
        const _id = id ? Number(id) : this.context.conversationMessageId;

        const res = await this.vk.api.messages.delete({
            peer_id: this.peerId,
            delete_for_all: 1,
            cmids: _id
        });

        return Boolean(res[_id]);
    }

    public async isChatAdmin(): Promise<boolean> {
        if (this._isAdmin !== undefined) return this._isAdmin;

        const res = (await this.vk.api.messages.getConversationsById({ peer_ids: this.context.peerId })).items?.[0];

        if (res?.peer.type != 'chat') {
            this._isAdmin = false;
            return false;
        }

        if (!res.chat_settings.admin_ids.includes(-config.vk.bot.id)) {
            this._isAdmin = false;
            return false;
        }

        this._isAdmin = true;

        return true;
    }
}