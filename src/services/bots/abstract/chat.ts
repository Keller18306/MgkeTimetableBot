import { BotServiceName } from ".";
import { config } from "../../../../config";
import { addNewBotUser, getBotUser, getChatLessonAliases, updateChatOptionsKeyByPeerId, updateKeyInTableByPeerId } from "../../../db";
import { arrayUnique } from "../../../utils";

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

    /** Почта привязанного гугл аккаунта */
    google_email: string | null;

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

    public abstract readonly service: BotServiceName;
    public abstract db_table: string;
    protected _cache: { [key: string]: any } = {};
    protected _aliasesCache?: { [key: string]: any } = undefined;
    protected defaultAllowSendMess: boolean = true;
    protected columns: string[] = [];

    public abstract get isAdmin(): boolean;
    public abstract get isChat(): boolean;

    public _initialized: boolean = false;

    constructor(dbChat?: DbChat) {
        if (dbChat) {
            this._cache = dbChat;
        }

        return new Proxy(this, {
            get: (target: this, p: string, receiver: any) => {
                if (!this._initialized) {
                    this.resync();
                }

                if (Object.keys(this._cache).includes(p)) {
                    return this._cache[p];
                }

                return Reflect.get(target, p, receiver);
            },
            set: (target: this, key: string, value: any, receiver: any) => {
                if (this._initialized && Object.keys(this._cache).includes(key)) {
                    if (typeof value === 'boolean') {
                        value = Number(value);
                    }

                    if (this.columns.includes(key)) {
                        updateKeyInTableByPeerId(this.db_table, key, value, this.peerId);
                    } else {
                        updateChatOptionsKeyByPeerId(this.db_table, this.service, key, value, this.peerId);
                    }

                    this._cache[key] = value;

                    return true;
                }

                return Reflect.set(target, key, value, receiver);
            }
        })
    }

    public resync(doNotCreate: boolean = false): this {
        const chat: any = getBotUser(this.db_table, this.service, this.peerId);

        if (!doNotCreate && chat == undefined) {
            const accepted: boolean = this.isChat ? config.accept.room : config.accept.private;
            addNewBotUser(this.db_table, this.service, this.peerId, accepted, this.defaultAllowSendMess)

            return this.resync(true);
        }

        this._cache = chat;
        this._initialized = true;

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

    public getLesonAliases(): { [key: string]: string } {
        if (!this._aliasesCache) {
            this._aliasesCache = getChatLessonAliases(this.service, this.id);
        }

        return this._aliasesCache;
    }
}

interface AbstractChat extends DbChat { };

export { AbstractChat };

