import { Bot, Message } from 'viber-bot';
import { App } from '../../../app';
import { BotServiceName, MessageOptions } from '../abstract';
import { BotChat } from '../chat';
import { AbstractBotEventListener } from "../events";
import { Keyboard } from "../keyboard";
import { ViberChat } from "./chat";
import { convertAbstractToViber } from './keyboard';

export class ViberEventListener extends AbstractBotEventListener {
    protected _model = ViberChat;
    public readonly service: BotServiceName = 'viber';

    private bot: Bot;

    constructor(app: App, bot: Bot) {
        super(app)
        this.bot = bot
    }

    public async sendMessage(chat: BotChat<ViberChat>, message: string, options: MessageOptions = {}) {
        return this.bot.sendMessage({ id: chat.serviceChat.peerId }, [
            new Message.Text(message, convertAbstractToViber(options.keyboard ? options.keyboard : new Keyboard(this.app, chat).MainMenu))
        ]).catch((err) => {
            if (err.status == 6) {
                chat.allowSendMess = false;
                return;
            }

            console.error('Viber send event error', err)
        })
    }
}