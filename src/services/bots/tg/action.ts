import { MessageContext } from "puregram";
import { AbstractAction, AbstractCommandContext, FileCache } from "../abstract";
import { BotInput } from "../input";
import { TgChat } from "./chat";
import { TgCommandContext } from "./context";

export class TgBotAction extends AbstractAction {
    protected context: MessageContext;
    protected chat: TgChat;
    protected _context: AbstractCommandContext;

    constructor(context: MessageContext, chat: TgChat, input: BotInput, cache: FileCache) {
        super();
        this.context = context;
        this.chat = chat;
        this._context = new TgCommandContext(context, input, cache);
    }

    async deleteLastMsg() {
        if (!this.chat.deleteLastMsg) return false;
        if (this.chat.lastMsgId == null) return false;

        try {
            await this.context.delete({
                chat_id: this.context.chatId,
                message_id: this.chat.lastMsgId
            })
        } catch (err: any) {
            console.error('actionDeleteLastMsg', err, this.context)
            return false;
        }

        this.chat.lastMsgId = null;

        return true;
    }

    async deleteUserMsg() {
        if (!this.chat.deleteUserMsg) return false;

        try {
            await this.context.delete({
                chat_id: this.context.chatId,
                message_id: this.context.id
            })
        } catch (err: any) {
            /*if (err.code == 15) {
                if (err.message.includes('(admin message)')) return false;

                if (!await this._context.isAdmin()) {
                    db.prepare('UPDATE `vk_bot_chats` SET `deleteUserMsg` = 0 WHERE `peerId` = ?').run(this.context.peerId)
                    await this.context.send('Удаление сообщений при нажатии кнопки выключено.\nПричина: нет прав администратора')
                    return false
                }

                console.error('actionDeleteUserMsg_1', err, this.context)

                return false;
            }*/

            console.error('actionDeleteUserMsg_2', err, this.context)
            return false;
        }

        return true;
    }

    async handlerLastMsgUpdate(context: MessageContext) {
        if (!this.chat.deleteLastMsg) return false;

        this.chat.lastMsgId = context.id;

        return true;
    }
}