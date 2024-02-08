import { APIError, Telegram } from "puregram";
import StatusCode from "status-code-enum";
import { config } from "../../../../config";
import { MessageOptions, Service } from "../abstract";
import { AbstractBotEventListener } from "../events";
import { Keyboard } from '../keyboard';
import { TgChat, TgDb } from './chat';
import { convertAbstractToTg } from "./keyboard";

export class TgEventListener extends AbstractBotEventListener<TgChat> {
    protected _tableName: string = 'tg_bot_chats';
    public readonly service: Service = 'tg';

    public enabled: boolean = config.vk.bot.noticer;

    private tg: Telegram;

    constructor(tg: Telegram) {
        super(config.telegram.noticer)
        this.tg = tg
    }

    protected createChat(chat: TgDb): TgChat {
        return new TgChat(chat);
    }

    public async sendMessage(chat: TgChat, message: string, options: MessageOptions = {}) {
        const keyboard = new Keyboard(undefined, chat)

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