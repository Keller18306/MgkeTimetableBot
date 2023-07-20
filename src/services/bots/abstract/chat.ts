import { Service } from ".";
import { config } from "../../../../config";
import db from "../../../db";
import { addslashes, arrayUnique } from "../../../utils";

export type ChatMode = 'student' | 'teacher' | 'parent' | 'guest'

export type DbChat = {
    /** Внутренний идентификатор чата в БД */
    id: number;

    /** Идентификатор чата в соцсети */
    peerId: number | string;

    /** Есть ли доступ к боту */
    accepted: boolean;

    /** Откуда пришёл юзер */
    ref: string | null;

    /** Текущая сцена */
    scene: string | null;

    /** Режим чата (ученик, преподаватель, родитель) */
    mode: ChatMode | null;

    /** Выбранная группа для ученика */
    group: number | null;

    /** Выбранное имя для преподавателя */
    teacher: string | null;

    /** Показывать ли кнопку "О боте" */
    showAbout: boolean;

    /** Показывать ли кнопку "На день" */
    showDaily: boolean;

    /** Показывать ли кнопку "На неделю" */
    showWeekly: boolean;

    /** Показывать ли кнопку "Звонки" */
    showCalls: boolean;

    /** Показывать ли кнопку "Группа" для быстрого получения группы */
    showFastGroup: boolean;

    /** Показывать ли кнопку "Преподаватель" для быстрого получения преподавателя */
    showFastTeacher: boolean;

    /** Скрывать ли прошедшие дни в расписаннии на неделю */
    hidePastDays: boolean;

    /** Удалять ли последнее сообщение в чате от бота */
    deleteLastMsg: boolean;

    /** Последний ID сообщения бота с расписанием */
    lastMsgId: number | null;

    /** Время последнего сообщения к боту */
    lastMsgTime: number;

    /** Удалять ли сообщение человека в чате после вызова расписания */
    deleteUserMsg: boolean;

    /** Разрешено ли отправлять сообщения */
    allowSendMess: boolean;

    /** Подписка на рассылку */
    subscribeDistribution: boolean;

    /** Оповещать ли о добавлении дней */
    noticeChanges: boolean;

    /** Оповещать ли о добавлении новой недели */
    noticeNextWeek: boolean;

    /** Оповещать ли при ошибках парсера (если 3 последние одинаковые ошибки) */
    noticeParserErrors: boolean;

    /** Нужно ли принудительно обновить кнопки */
    needUpdateButtons: boolean;

    /** Нужно ли отображать время последнего обновления расписания */
    showParserTime: boolean;

    /** Показывать ли подсказки под расписанием */
    showHints: boolean;

    /** Было ли показано сообщение о еуле */
    eula: boolean;

    /** История поиска групп (JSON) */
    historyGroup: string;

    /** История поиска преподавателей (JSON) */
    historyTeacher: string;

    /** Какое форматирование расписания использовать */
    scheduleFormatter: number;

    /**
     * Отключить проверку по текущему режиму для оповещений о добавлении дней.
     * Если указана группа/преподаватель, то будут всё равно приходить оповещения, даже если не выбран режим
    */
    deactivateSecondaryCheck: boolean;
}

const SEARCH_HISTORY_LENGTH: number = 3;

abstract class AbstractChat {
    public abstract peerId: number | string;

    public abstract readonly service: Service;
    public abstract db_table: string;
    protected _cache: { [key: string]: any } = {};
    protected defaultAllowSendMess: boolean = true;
    protected columns: string[] = [];

    public abstract get isAdmin(): boolean;
    public abstract get isChat(): boolean;

    private initialized: boolean = false;

    constructor() {
        return new Proxy(this, {
            get: (target: this, p: string, receiver: any) => {
                if (!this.initialized) {
                    this.resync();
                    this.initialized = true;
                }

                if (Object.keys(this._cache).includes(p)) {
                    return this._cache[p];
                }

                return Reflect.get(target, p, receiver);
            },
            set: (target: this, p: string, value: any, receiver: any) => {
                if (Object.keys(this._cache).includes(p)) {
                    if (typeof value === 'boolean') {
                        value = Number(value);
                    }

                    const key: string = addslashes(p);

                    if (this.columns.includes(p)) {
                        db.prepare(`UPDATE ${this.db_table} SET \`${key}\` = ? WHERE peerId = ?`).run(value, this.peerId);
                    } else {
                        db.prepare(`UPDATE chat_options SET \`${key}\` = ? WHERE id = (
                            SELECT id FROM ${this.db_table} WHERE peerId = ?
                        ) AND service = ?`).run(value, this.peerId, this.service);
                    }

                    this._cache[p] = value;

                    return true;
                }

                return Reflect.set(target, p, value, receiver);
            }
        })
    }

    public resync(doNotCreate: boolean = false): this {
        const chat: any = db.prepare(`SELECT * FROM ${this.db_table} JOIN chat_options ON ${this.db_table}.id = chat_options.id AND chat_options.service = ? WHERE ${this.db_table}.peerId = ?`).get(this.service, this.peerId);

        if (!doNotCreate && chat == undefined) {
            const { lastInsertRowid } = db.prepare(`INSERT INTO ${this.db_table} (peerId) VALUES (?)`).run(this.peerId);
            db.prepare(
                'INSERT INTO chat_options (`service`, `id`, `accepted`, `allowSendMess`) VALUES (?, ?, ?, ?)'
            ).run(
                this.service, lastInsertRowid, +(this.isChat ? config.accept.room : config.accept.private), +this.defaultAllowSendMess
            )

            return this.resync(true);
        }

        this._cache = chat;

        return this;
    }

    public get groupSearchHistory(): string[] {
        try {
            return JSON.parse(this.historyGroup).slice(0, SEARCH_HISTORY_LENGTH);
        } catch (e) {
            return [];
        }
    }

    public set groupSearchHistory(value: string[]) {
        this.historyGroup = JSON.stringify(arrayUnique(value).slice(0, SEARCH_HISTORY_LENGTH));
    }

    public appendGroupSearchHistory(value: string) {
        const history = this.groupSearchHistory;
        history.unshift(value);
        this.groupSearchHistory = history;
    }

    public get teacherSearchHistory(): string[] {
        try {
            return JSON.parse(this.historyTeacher).slice(0, SEARCH_HISTORY_LENGTH);
        } catch (e) {
            return [];
        }
    }

    public set teacherSearchHistory(value: string[]) {
        this.historyTeacher = JSON.stringify(arrayUnique(value).slice(0, SEARCH_HISTORY_LENGTH));
    }

    public appendTeacherSearchHistory(value: string) {
        const history = this.teacherSearchHistory;
        history.unshift(value);
        this.teacherSearchHistory = history;
    }

}

interface AbstractChat extends DbChat { };

export { AbstractChat };

