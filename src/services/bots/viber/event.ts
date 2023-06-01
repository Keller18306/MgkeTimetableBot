import { Bot, Message } from 'viber-bot';
import { config } from "../../../../config";
import { AbstractEventListener } from "../../../updater/events";
import { Service } from '../abstract/command';
import { Keyboard } from "../keyboard";
import { ViberChat, ViberDb } from "./chat";
import { convertAbstractToViber } from './keyboard';

export class ViberEventListener extends AbstractEventListener<ViberDb> {
    protected _tableName: string = 'viber_bot_chats';
    protected service: Service = 'viber';

    private bot: Bot

    constructor(bot: Bot) {
        super(config.viber.noticer)
        this.bot = bot
    }

    protected async sendMessage(chat: ViberChat, message: string) {
        const keyboard = new Keyboard(undefined, chat)

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