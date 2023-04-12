import { config } from "../../../config";
import db from "../../db";
import { ApiKey } from "../../key";

const keyTool = new ApiKey(config.encrypt_key)

export type KeyData = {
    id: number,
    service: string | null,
    fromId: bigint | null,
    limitPerSec: number,
    iv: string | null,
    last_time: number | null,

    resync: () => KeyData
}

export class Key {
    private _key: string;
    private _id?: bigint;
    private _iv?: string;

    private _limitPerSecond?: number;

    constructor(key: string) {
        this._key = key

        try {
            const { id, iv } = keyTool.parseKey(this._key)

            this._id = id
            this._iv = iv
        } catch (e) { }
    }

    isValid(): boolean {
        if (this._id == undefined || this._iv == undefined) return false;

        const key = this.get()
        this._limitPerSecond = key.limitPerSec

        if (this._iv !== key.iv) return false;

        return true
    }

    get(): KeyData {
        if (this._id == null) throw new Error('key is not valid')
        
        const data = db.prepare('SELECT * FROM `api` WHERE `id` = ?').get(this._id);

        db.prepare('UPDATE `api` SET `last_time` = ? WHERE `id` = ?').run(Date.now(), this._id)

        data.resync = (): KeyData => {
            return Object.assign(data, this.get())
        }

        return data
    }

    get id(): bigint {
        if (this._id == null) throw new Error('key is not valid')

        return this._id
    }

    get limit() {
        if (this._limitPerSecond == null) {
            this._limitPerSecond = this.get().limitPerSec
        }

        return this._limitPerSecond
    }
}