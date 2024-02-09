import { Bot, Message } from 'viber-bot';
import { config } from "../../../../config";
import { MessageOptions, Service } from '../abstract';
import { AbstractBotEventListener } from "../events";
import { Keyboard } from "../keyboard";
import { ViberChat, ViberDb } from "./chat";
import { convertAbstractToViber } from './keyboard';
import { App } from '../../../app';

export class ViberEventListener extends AbstractBotEventListener<ViberChat> {
    protected _tableName: string = 'viber_bot_chats';
    public readonly service: Service = 'viber';

    private bot: Bot

    constructor(app: App, bot: Bot) {
        super(app)
        this.bot = bot
    }

    protected createChat(chat: ViberDb): ViberChat {
        return new ViberChat(chat);
    }

    protected async sendMessage(chat: ViberChat, message: string, options: MessageOptions = {}) {
        const keyboard = new Keyboard(this.app, chat)

        return this.bot.sendMessage({ id: chat.peerId }, [
            new Message.Text(message, convertAbstractToViber(keyboard.MainMenu))
        ]).catch((err) => {
            if (err.status == 6) {
                chat.allowSendMess = false;
                return;
            }

            console.error('Viber send event error', err)
        })
    }
}