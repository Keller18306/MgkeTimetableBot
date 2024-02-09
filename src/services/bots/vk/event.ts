import { APIError, getRandomId, VK } from "vk-io";
import { config } from "../../../../config";
import { App } from "../../../app";
import { MessageOptions, Service } from "../abstract";
import { AbstractBotEventListener } from "../events";
import { VkChat, VkDb } from './chat';

export class VkEventListener extends AbstractBotEventListener<VkChat> {
    protected _tableName: string = 'vk_bot_chats';
    public readonly service: Service = 'vk';

    private vk: VK;

    constructor(app: App, vk: VK) {
        super(app)
        this.vk = vk
    }

    protected createChat(chat: VkDb): VkChat {
        return new VkChat(chat);
    }

    protected async sendMessage(chat: VkChat, message: string, options: MessageOptions = {}) {
        return this.vk.api.messages.send({
            peer_id: chat.peerId,
            message,
            random_id: getRandomId()
        }).catch((err: APIError) => {
            if ([7, 901, 936].includes(+err.code)) {
                chat.allowSendMess = false;
                return;
            }
            console.error('VK send event error', err)
        })
    }
}