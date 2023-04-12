import { ContextDefaultState, MessageContext } from "vk-io";
import db from "../../../db";
import { AbstractAction } from "../abstract/action";
import { AbstractCommandContext } from "../abstract/command";
import { FileCache } from "../abstract/fileCache";
import { BotInput } from "../input";
import { VkChat } from "./chat";
import { VkCommandContext } from "./context";

export class VkBotAction extends AbstractAction {
    protected context: MessageContext<ContextDefaultState>;
    protected chat: VkChat;
    protected _context: AbstractCommandContext;

    constructor(context: MessageContext<ContextDefaultState>, chat: VkChat, input: BotInput, cache: FileCache) {
        super()
        this.context = context
        this.chat = chat
        this._context = new VkCommandContext(context, input, cache)
    }

    async deleteLastMsg() {
        if (!this.chat.deleteLastMsg) return false;
        if (this.chat.lastMsgId == null) return false;

        try {
            await this.context.deleteMessage({
                conversation_message_ids: this.chat.lastMsgId as number,
                peer_id: this.context.peerId,
                delete_for_all: 1
            })
        } catch (err: any) {
            console.error('actionDeleteLastMsg', err, this.context)
            return false;
        }

        db.prepare('UPDATE `vk_bot_chats` SET `lastMsgId` = ? WHERE `peerId` = ?').run(null, this.context.peerId)

        return true;
    }

    async deleteUserMsg() {
        if (!this.chat.deleteUserMsg) return false;

        try {
            await this.context.deleteMessage({
                conversation_message_ids: this.context.conversationMessageId,
                delete_for_all: 1,
                peer_id: this.context.peerId
            })
        } catch (err: any) {
            if (err.code == 15) {
                if (err.message.includes('(admin message)')) return false;

                if (!await this._context.isAdmin()) {
                    db.prepare('UPDATE `vk_bot_chats` SET `deleteUserMsg` = 0 WHERE `peerId` = ?').run(this.context.peerId)
                    await this.context.send('Удаление сообщений при нажатии кнопки выключено.\nПричина: нет прав администратора')
                    return false
                }

                console.error('actionDeleteUserMsg_1', err, this.context)

                return false;
            }

            console.error('actionDeleteUserMsg_2', err, this.context)
            return false;
        }

        return true;
    }

    async handlerLastMsgUpdate(context: MessageContext<ContextDefaultState>) {
        if (!this.chat.deleteLastMsg) return false;
        if (!context.conversationMessageId) return false;

        db.prepare('UPDATE `vk_bot_chats` SET `lastMsgId` = ? WHERE `peerId` = ?').run(context.conversationMessageId, this.context.peerId)

        return true;
    }
}