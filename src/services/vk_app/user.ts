import { config } from "../../../config";
import db from "../../db";
import { FromType, RequestKey } from "../../key";
import { checkSign } from "../../utils/checkSign";
import { VkChat } from "../bots/vk/chat";

const acceptTool = new RequestKey(config.encrypt_key)

export type UserData = {
    id: number,
    user_id: number,
    accepted: number,
    ref: string | null,
    group: string | null,
    teacher: string | null,
    theme_id: number,
    adblock: number,
    insert_time: number,
    last_time: number,
    allowBotAccept: number,
    firstPage: string,

    resync: () => UserData
}

export class VKAppUser {
    public url: string;
    public vk_id: number;

    public query: {
        [key: string]: string
    } = {}


    private parseUrl(url: string) {
        const data = new URL(url)

        const query: {
            [key: string]: string
        } = {}

        data.searchParams.forEach((value, key) => {
            query[key] = value
        })

        return query
    }

    constructor(url: string) {
        this.url = url;
        this.query = this.parseUrl(url);
        this.vk_id = Number(this.query.vk_user_id);
    }

    checkSign(validTime: number | false = 86400) {
        return checkSign(this.url, config.vk.app, validTime)
    }

    get(doNotCreate: boolean = false): UserData {
        const data: any = db.prepare('SELECT * FROM `vk_app_users` WHERE `user_id` = ?').get(this.vk_id);

        if (!doNotCreate && data == undefined) {
            db.prepare('INSERT INTO `vk_app_users` (`user_id`, `accepted`, `insert_time`, `last_time`) VALUES (?, ?, ?, ?)').run(
                this.vk_id,
                +config.accept.app,
                Date.now(),
                Date.now()
            )
            return this.get(doNotCreate)
        }

        db.prepare('UPDATE `vk_app_users` SET `last_time` = ? WHERE `user_id` = ?').run(Date.now(), this.vk_id)

        data.resync = (): UserData => {
            return Object.assign(data, this.get(doNotCreate))
        }

        return data
    }

    getFromBot(): VkChat | null {
        return new VkChat(this.vk_id).resync(true);
    }

    get accepted() {
        return Boolean(this.get().accepted)
    }

    set accepted(value: boolean) {
        db.prepare('UPDATE `vk_app_users` SET `accepted` = ? WHERE `user_id` = ?').run(value, this.vk_id)
    }

    get allowBotAccept() {
        return Boolean(this.get().allowBotAccept)
    }

    set allowBotAccept(value: boolean) {
        db.prepare('UPDATE `vk_app_users` SET `allowBotAccept` = ? WHERE `user_id` = ?').run(value, this.vk_id)
    }

    get acceptKey() {
        return acceptTool.getKey({
            from: FromType.VKApp,
            user_id: this.vk_id,
            time: Date.now()
        })
    }
}