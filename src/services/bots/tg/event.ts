import { APIError, Telegram } from "puregram";
import StatusCode from "status-code-enum";
import { App } from "../../../app";
import { BotServiceName, MessageOptions } from "../abstract";
import { AbstractBotEventListener } from "../events";
import { Keyboard } from '../keyboard';
import { TgChat, TgDb } from './chat';
import { convertAbstractToTg } from "./keyboard";

export class TgEventListener extends AbstractBotEventListener<TgChat> {
    protected _tableName: string = 'tg_bot_chats';
    public readonly service: BotServiceName = 'tg';

    private tg: Telegram;

    constructor(app: App, tg: Telegram) {
        super(app)
        this.tg = tg
    }

    protected createChat(chat: TgDb): TgChat {
        return new TgChat(chat);
    }

    public async sendMessage(chat: TgChat, message: string, options: MessageOptions = {}) {
        const keyboard = new Keyboard(this.app, chat)

        return this.tg.api.sendMessage({
            text: message,
            chat_id: chat.peerId,
            ...(!options.disableHtmlParser ? {
                parse_mode: 'HTML',
            } : {}),
            reply_markup: convertAbstractToTg(keyboard.MainMenu)
        }).catch((err: APIError) => {
            if (err.code === StatusCode.ClientErrorForbidden) {
                chat.allowSendMess = false;
                return;
            }

            console.error('TG send event error', err)
        })
    }
}