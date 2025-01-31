import { APIError, Telegram } from "puregram";
import StatusCode from "status-code-enum";
import { App } from "../../../app";
import { BotServiceName, MessageOptions } from "../abstract";
import { BotChat } from "../chat";
import { AbstractBotEventListener } from "../events";
import { Keyboard } from '../keyboard';
import { TgChat } from './chat';
import { convertAbstractToTg } from "./keyboard";

export class TgEventListener extends AbstractBotEventListener {
    protected _model = TgChat;
    public readonly service: BotServiceName = 'tg';

    private tg: Telegram;

    constructor(app: App, tg: Telegram) {
        super(app)
        this.tg = tg
    }

    public async sendMessage(chat: BotChat<TgChat>, message: string, options: MessageOptions = {}) {
        return this.tg.api.sendMessage({
            text: message,
            chat_id: chat.serviceChat.peerId,
            ...(!options.disableHtmlParser ? {
                parse_mode: 'HTML',
            } : {}),
            reply_markup: convertAbstractToTg(options.keyboard ? options.keyboard : new Keyboard(this.app, chat).MainMenu)
        }).catch((err: APIError) => {
            if (err.code === StatusCode.ClientErrorForbidden) {
                chat.allowSendMess = false;
                return;
            }

            console.error('TG send event error', err)
        })
    }
}