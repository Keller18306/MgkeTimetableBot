import { APIError, getRandomId, VK } from "vk-io";
import { App } from "../../../app";
import { BotServiceName, MessageOptions } from "../abstract";
import { BotChat } from "../chat";
import { AbstractBotEventListener } from "../events";
import { Keyboard } from "../keyboard";
import { VkChat } from './chat';
import { convertAbstractToVK } from "./keyboard";

export class VkEventListener extends AbstractBotEventListener {
    protected _model = VkChat;
    public readonly service: BotServiceName = 'vk';

    private vk: VK;

    constructor(app: App, vk: VK) {
        super(app)
        this.vk = vk
    }

    public async sendMessage(chat: BotChat<VkChat>, message: string, options: MessageOptions = {}) {
        return this.vk.api.messages.send({
            peer_id: chat.serviceChat.peerId,
            message,
            random_id: getRandomId(),
            keyboard: convertAbstractToVK(options.keyboard ? options.keyboard : new Keyboard(this.app, chat).MainMenu)
        }).catch((err: APIError) => {
            if ([7, 901, 936].includes(+err.code)) {
                chat.allowSendMess = false;
                return;
            }
            console.error('VK send event error', err)
        })
    }
}