import { config } from "../../../../config";
import db from "../../../db";
import { AbstractChat, DbChat } from "../abstract/chat";
import { Theme } from "./keyboardBuilder";

export type ViberDb = DbChat & {
    peerId: string,
    theme: Theme,
    lastUpdateDI: number,
    name: string | null,
    device_os: string | null,
    viber_version: string | null,
    device_type: string | null
}

class ViberChat extends AbstractChat {
    public peerId: string;
    public db_table: string = 'viber_bot_chats';

    private updateDITime: number = 12 * 60 * 60 * 1000;
    protected defaultAllowSendMess: boolean = false;

    constructor(peerId: string) {
        super()
        this.peerId = peerId;
    }

    public get isChat(): boolean {
        return false
    }

    public get isAdmin(): boolean {
        if (this.isChat) return false;

        return config.viber.admin_ids.includes(this.peerId)
    }

    public setDeviceInfo(name: string, device_os: string, viber_version: string, device_type: string) {
        if (this._cache) {
            this._cache.name = name;
            this._cache.device_os = device_os;
            this._cache.viber_version = viber_version;
            this._cache.device_type = device_type;
        }

        db.prepare(
            'UPDATE ' + this.db_table + ' SET name = ?, device_os = ?, viber_version = ?, device_type = ?, lastUpdateDI = ? WHERE peerId = ?'
        ).run(
            name, device_os, viber_version, device_type, Date.now(), this.peerId
        )
    }

    public needUpdateDeviceInfo(): boolean {
        return Date.now() - this.lastUpdateDI >= this.updateDITime
    }
}

interface ViberChat extends ViberDb { };

export { ViberChat };
