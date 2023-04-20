import { config } from "../../../../config";
import db from "../../../db";

export type ChatMode = 'student' | 'teacher' | 'parent' | 'guest'

export type DbChat = {
    /** Внутренний идентификатор чата в БД */
    id: number,

    /** Идентификатор чата в соцсети */
    peerId: number | string,

    /** Есть ли доступ к боту */
    accepted: boolean,

    /** Откуда пришёл юзер */
    ref: string | null,

    /** Текущая сцена */
    scene: string | null,

    /** Режим чата (ученик, учитель, родитель) */
    mode: ChatMode | null,

    /** Выбранная группа для ученика */
    group: number | null,

    /** Выбранное имя для учителя */
    teacher: string | null,

    /** Оповещать ли о добавлении дней */
    noticeChanges: boolean,

    /** Показывать ли кнопку "О боте" */
    showAbout: boolean,

    /** Показывать ли кнопку "На день" */
    showDaily: boolean,

    /** Показывать ли кнопку "На неделю" */
    showWeekly: boolean,

    /** Показывать ли кнопку "Звонки" */
    showCalls: boolean,

    /** Показывать ли кнопку "Группа" для быстрого получения группы */
    showFastGroup: boolean,

    /** Показывать ли кнопку "Преподаватель" для быстрого получения учителя */
    showFastTeacher: boolean,

    /** Убирать ли прошедшие дни в расписаннии */
    removePastDays: boolean,

    /** Удалять ли последнее сообщение в чате от бота */
    deleteLastMsg: boolean,

    /** Последний ID сообщения бота с расписанием */
    lastMsgId: number | null,

    /** Время последнего сообщения к боту */
    lastMsgTime: number,

    /** Удалять ли сообщение человека в чате после вызова расписания */
    deleteUserMsg: boolean,

    /** Разрешено ли отправлять сообщения */
    allowSendMess: boolean,

    /** Подписка на рассылку */
    subscribeMess: boolean,

    /** Нужно ли принудительно обновить кнопки */
    needUpdateButtons: boolean,

    /** Нужно ли отображать время последнего обновления расписания */
    showParserTime: boolean,

    /** Было ли показано сообщение о еуле */
    eula: boolean,

    /**
     * Отключить проверку по текущему режиму для оповещений о добавлении дней.
     * Если указана группа/учитель, то будут всё равно приходить оповещения, даже если не выбран режим
    */
    deactivateSecondaryCheck: boolean
}

abstract class AbstractChat {
    public abstract peerId: number | string;
    
    protected abstract db_table: string;
    protected _cache: { [key: string]: any } = {};
    protected defaultAllowSendMess: boolean = true;

    public abstract get isAdmin(): boolean;
    public abstract get isChat(): boolean;

    private initialized: boolean = false;

    constructor() {
        return new Proxy(this, {
            get: (target: this, p: string, receiver: any) => {
                if (!this.initialized) {
                    this.resync()
                    this.initialized = true;
                }

                if (Object.keys(this._cache).includes(p)) {
                    return this._cache[p];
                }

                return Reflect.get(target, p, receiver);
            },
            set: (target: this, p: string, value: any, receiver: any) => {
                if (Object.keys(this._cache).includes(p)) {
                    //UNSAFE
                    //TODO SPLASHES
                    if (typeof value === 'boolean') {
                        value = Number(value)
                    }

                    db.prepare('UPDATE ' + this.db_table + ' SET `' + p + '` = ? WHERE `peerId` = ?').run(value, this.peerId)
                    this._cache[p] = value;

                    return true;
                }

                return Reflect.set(target, p, value, receiver);
            }
        })
    }

    public resync(doNotCreate: boolean = false): this {
        const chat = db.prepare('SELECT * FROM ' + this.db_table + ' WHERE `peerId` = ?').get(this.peerId);

        if (!doNotCreate && chat == undefined) {
            db.prepare(
                'INSERT INTO ' + this.db_table + ' (`peerId`, `accepted`, `allowSendMess`) VALUES (?, ?, ?)'
            ).run(
                this.peerId, +(this.isChat ? config.accept.room : config.accept.private), +this.defaultAllowSendMess
            )

            return this.resync(true);
        }
        
        this._cache = chat;

        return this;
    }
}

interface AbstractChat extends DbChat { };

export { AbstractChat }