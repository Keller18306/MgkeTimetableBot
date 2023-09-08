import { APIError, getRandomId, VK } from "vk-io";
import { config } from "../../../../config";
import { AbstractEventListener } from "../../../updater/events";
import { MessageOptions, Service } from "../abstract";
import { VkChat, VkDb } from './chat';

export class VkEventListener extends AbstractEventListener<VkChat> {
    protected _tableName: string = 'vk_bot_chats';
    protected service: Service = 'vk';

    public enabled: boolean = config.vk.bot.noticer;

    private vk: VK;

    constructor(vk: VK) {
        super(config.vk.bot.noticer)
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