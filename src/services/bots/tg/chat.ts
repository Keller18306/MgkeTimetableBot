import { Chat, User } from "puregram";
import { config } from "../../../../config";
import db from "../../../db";
import { AbstractChat, DbChat, Service } from "../abstract";

export type TgDb = DbChat & {
    /** Юзернейм */
    domain: string | null;

    /** Отображаемое имя */
    firstName: string;

    /** Отображаемая фамилия */
    lastName: string;

    /** Язык пользователя в Telegram */
    lang: string;
}

class TgChat extends AbstractChat {
    public peerId: number;

    public db_table: string = 'tg_bot_chats';
    public readonly service: Service = 'tg';
    protected columns: string[] = [
        'domain', 'firstName', 'lastName', 'lang'
    ];

    constructor(peerId: number) {
        super()
        this.peerId = peerId;
    }

    public updateChat(chat: Chat, user?: User) {
        let domain: string | null = null;
        let firstName: string | null = null;
        let lastName: string | null = null;
        let lang: string | null = null;

        if (chat.id === user?.id) {
            domain = user.username || null
            firstName = user.firstName || null
            lastName = user.lastName || null
            lang = user.languageCode || null
        } else {
            domain = chat.username || null
        }

        db.prepare(
            'UPDATE ' + this.db_table + ' SET `domain` = ?, `firstName` = ?, `lastName` = ?, `lang` = ? WHERE `peerId` = ?',
        ).run(
            domain, firstName, lastName, lang, this.peerId
        )
    }

    public get isChat(): boolean {
        //return this.peerId > 2e9
        return false;
    }

    public get isAdmin(): boolean {
        if (this.isChat) return false;

        return config.telegram.admin_ids.includes(this.peerId)
    }
}

interface TgChat extends TgDb { };

export { TgChat };

