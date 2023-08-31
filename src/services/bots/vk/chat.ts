import { config } from "../../../../config";
import { AbstractChat, DbChat, Service } from "../abstract";

export type VkDb = DbChat & {
    peerId: number; //переопределение как число

    /** Разрешено ли юзеру подтвердить себе приложение ВК, если оно не было подтверждено */
    allowVkAppAccept: boolean;
}

class VkChat extends AbstractChat {
    public peerId: number;

    public db_table: string = 'vk_bot_chats';
    public readonly service: Service = 'vk';
    protected columns: string[] = [
        'allowVkAppAccept'
    ];

    constructor(peerId: number | VkDb) {
        if (typeof peerId === 'object') {
            super(peerId);
            this.peerId = peerId.peerId;
            return;
        }

        super();
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

