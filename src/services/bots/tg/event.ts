import { APIError, Telegram } from "puregram";
import StatusCode from "status-code-enum";
import { config } from "../../../../config";
import { AbstractEventListener } from "../../../updater/events";
import { Service } from "../abstract";
import { Keyboard } from '../keyboard';
import { TgChat, TgDb } from './chat';
import { convertAbstractToTg } from "./keyboard";

export class TgEventListener extends AbstractEventListener<TgDb> {
    protected _tableName: string = 'tg_bot_chats';
    protected service: Service = 'tg';
    protected adminIds: number[] = config.telegram.admin_ids;

    public enabled: boolean = config.vk.bot.noticer;

    private tg: Telegram;

    constructor(tg: Telegram) {
        super(config.telegram.noticer)
        this.tg = tg
    }

    public async sendMessage(chat: TgChat, message: string) {
        const keyboard = new Keyboard(undefined, chat)

        return this.tg.api.sendMessage({
            text: message,
            chat_id: chat.peerId,
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