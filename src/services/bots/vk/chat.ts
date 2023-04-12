import { config } from "../../../../config";
import { AbstractChat, DbChat } from "../abstract/chat";

export type VkDb = DbChat & {
    peerId: number;
    duty_student: number | null,
    allowVkAppAccept: boolean,
}

class VkChat extends AbstractChat {
    public peerId: number;
    public db_table: string = 'vk_bot_chats';

    constructor(peerId: number) {
        super()
        this.peerId = peerId;
    }

    public get isChat(): boolean {
        return this.peerId > 2e9
    }

    public get isAdmin(): boolean {
        if (this.isChat) return false;

        return config.vk.admin_ids.includes(this.peerId)
    }
}

interface VkChat extends VkDb { };

export { VkChat };
