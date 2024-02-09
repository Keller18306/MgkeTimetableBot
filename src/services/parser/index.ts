import { readFileSync } from "fs"
import got from "got"
import { JSDOM } from "jsdom"
import { config } from "../../../config"
import { App, AppService } from "../../app"
import { DayIndex, WeekIndex, mergeDays } from "../../utils"
import { TypedEventEmitter } from "../../utils/events"
import { ChatMode } from "../bots/abstract"
import { clearOldImages } from "../image/clear"
import { ArchiveAppendDay } from "../timetable"
import { Group, GroupDay, Groups, Teacher, TeacherDay, Teachers, Team } from '../timetable/types'
import StudentParser from "./group"
import { RaspEntryCache, TeamCache, loadCache, raspCache, saveCache } from './raspCache'
import TeacherParser from "./teacher"
import TeamParser from "./team"

const MAX_LOG_LIMIT: number = 10;
const LOG_COUNT_SEND: number = 3;

type Delay = {
    promise: Promise<void>,
    resolve: () => void
}

function createDelayPromise(ms: number): Delay {
    let resolveFunc: (() => void) | undefined;

    const promise = new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, ms);

        resolveFunc = () => {
            clearTimeout(timeout);
            resolve()
        }
    });

    if (!resolveFunc) {
        throw new Error('something went wrong')
    };

    return {
        promise,
        resolve: resolveFunc
    }
}

function onParser<T>(Parser: typeof StudentParser | typeof TeacherParser, onStudent: T, onTeacher: T): T {
    if (Parser === StudentParser) {
        return onStudent;
    }

    if (Parser === TeacherParser) {
        return onTeacher;
    }

    throw new Error('unknown parser')
}

export type GroupDayEvent = { day: GroupDay, group: string };
export type TeacherDayEvent = { day: TeacherDay, teacher: string };

type ParserEvents = {
    addGroupDay: [data: GroupDayEvent];
    updateGroupDay: [data: GroupDayEvent];

    addTeacherDay: [data: TeacherDayEvent];
    updateTeacherDay: [data: TeacherDayEvent];

    updateWeek: [chatMode: ChatMode, weekIndex: number];

    error: [error: Error];
}

export class ParserService implements AppService {
    public events: TypedEventEmitter<ParserEvents>;

    private logs: { date: Date, result: string | Error }[] = [];
    private delayPromise?: Delay;

    private _forceParse: boolean = false;
    private _clearKeys: boolean = false;

    constructor(private app: App) {
        this.events = new TypedEventEmitter<ParserEvents>();
    }

    public getLogs() {
        return this.logs.slice();
    }

    public clearAllLogs() {
        this.logs = []
    }

    public removeOldLogs() {
        if (this.logs.length <= MAX_LOG_LIMIT) {
            return false;
        }

        this.logs.splice(MAX_LOG_LIMIT, this.logs.length - MAX_LOG_LIMIT)

        return true;
    }

    public register(): boolean {
        // todo rewrite
        // return config.updater.enabled;
        return true;
    }

    public run() {
        loadCache();

        if (config.updater.enabled) {
            this.runLoop();
        }
    }

    public lastSuccessUpdate(): number {
        const times = [
            raspCache.groups.update,
            raspCache.teachers.update
        ]

        const min = Math.min(...times)
        const max = Math.max(...times)

        if (min === 0) return 0;

        return max
    }

    public isHasErrors(need: number = 3): boolean {
        const logs = this.logs.slice(0, need);

        let errorsCount: number = 0;
        for (const log of logs) {
            if (log.result instanceof Error) {
                errorsCount++
            }
        }

        return errorsCount === need;
    }

    public forceParse(clearKeys: boolean = false) {
        this._forceParse = true;
        this._clearKeys = clearKeys;
        this.delayPromise?.resolve();
    }

    private getDelayTime(error: boolean = false): Delay {
        if (error) return createDelayPromise(config.updater.update_interval.error * 1e3)

        // во время локального тестирования - 3 секунды
        if (config.updater.localMode) {
            return createDelayPromise(3e3);
        }

        const date = new Date()
        const hour = date.getHours()

        //в воскресенье не нужно часто
        if (date.getDay() !== 0 && config.updater.activity[0] <= hour && hour <= config.updater.activity[1]) {
            return createDelayPromise(config.updater.update_interval.activity * 1e3)
        }

        //фикс для убирания задержки во время активности
        const startHour = (config.updater.activity[0] - Math.ceil(config.updater.update_interval.default / (1 * 60 * 60)))
        if (hour >= startHour && hour <= config.updater.activity[0]) {
            const endTime = new Date(date.getTime() + config.updater.update_interval.default * 1e3)

            if (endTime.getHours() >= config.updater.activity[0]) {
                endTime.setHours(config.updater.activity[0])
                endTime.setMinutes(0)
                endTime.setSeconds(0)
                endTime.setMilliseconds(0)

                return createDelayPromise(
                    Math.max(0, endTime.getTime() - date.getTime())
                )
            }
        }

        return createDelayPromise(config.updater.update_interval.default * 1e3)
    }

    private log(log: string | Error) {
        this.logs.unshift({
            date: new Date(),
            result: log
        });

        if (this.isHasErrors()) {
            this.logNoticer()
        }
    }

    private logNoticer() {
        let hits: number = 0;

        let val: string | undefined;
        let error: Error | undefined;

        for (const log of this.logs.slice(0, LOG_COUNT_SEND + 1)) {
            const err: string | Error = log.result;

            if (!(err instanceof Error)) {
                return;
            }

            if (!val || !error) {
                val = err.message;
                error = err;
            }

            if (val === err.message) {
                hits++
            }
        }

        if (!val || !error) {
            return;
        }

        if (hits === LOG_COUNT_SEND) {
            console.error('update error', error);
            this.events.emit('error', error);
        }
    }

    private async runLoop() {
        while (true) {
            await this.loop();
        }
    }

    private async loop() {
        let error: boolean = false;

        try {
            const ms = await this.runActionsWithTimeout();

            raspCache.successUpdate = true;

            this.log(`success: ${ms}ms`);
        } catch (e: any) {
            raspCache.successUpdate = false;
            error = true;

            this.log(e)
        }

        await saveCache();

        this._clearKeys = false;
        this._forceParse = false;
        this._cacheTeamCleared = false;
        this.removeOldLogs();

        this.delayPromise = this.getDelayTime(error);
        await this.delayPromise.promise;
    }

    private async runActionsWithTimeout() {
        return new Promise<number>(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('update timed out'))
            }, 60e3);

            let ms: number;
            try {
                const startTime: number = Date.now();

                const res = await this.runActions();

                const updateTime: number = Date.now();
                clearTimeout(timeout);

                await clearOldImages();

                if (!res[0] || !res[1]) {
                    throw new Error(`timetable is empty {groups:${res[0]},teachers:${res[1]}}`);
                }

                ms = updateTime - startTime;
            } catch (e) {
                return reject(e);
            }

            resolve(ms);
        })
    }

    private async runActions(): Promise<boolean[]> {
        const PARSER_ACTIONS = [
            this.parseTimetable.bind(
                this, StudentParser, encodeURI(config.updater.endpoints.timetableGroup), raspCache.groups
            ),

            this.parseTimetable.bind(
                this, TeacherParser, encodeURI(config.updater.endpoints.timetableTeacher), raspCache.teachers
            )
        ];

        //парсим страницы реже
        if (
            this._forceParse || this._clearKeys || config.updater.localMode || !raspCache.team.update ||
            Date.now() - raspCache.team.update >= config.updater.update_interval.teams * 1e3
        ) {
            for (const i in config.updater.endpoints.team) {
                const url = config.updater.endpoints.team[i];

                const action = this.parseTeam.bind(
                    this, Number(i), encodeURI(url), raspCache.team
                )

                PARSER_ACTIONS.push(action);
            }
        }

        const promises: Promise<boolean>[] = [];
        for (const action of PARSER_ACTIONS) {
            const result: Promise<boolean> = action();
            promises.push(result)

            if (config.updater.syncMode) {
                await result;
            }
        }

        return Promise.all(promises);
    }

    private async parseTimetable(Parser: typeof TeacherParser | typeof StudentParser, url: string, cache: RaspEntryCache<Teachers | Groups>) {
        let data: Teachers | Groups;
        if (config.updater.localMode) {
            const fileName: string = onParser<string>(Parser, 'groups', 'teachers');
            const file: any = JSON.parse(readFileSync(`./cache/rasp/${fileName}.json`, 'utf8'));

            data = file.timetable;
        } else {
            const jsdom = await this.getJSDOM(url);

            const parser = new Parser(jsdom.window);
            const hash = parser.getContentHash();

            if (!config.updater.ignoreHash && !this._forceParse && hash === cache.hash) {
                cache.update = Date.now();
                return true;
            } else if (hash !== cache.hash) {
                cache.changed = Date.now();
            }

            cache.hash = hash;

            const parserName = onParser<string>(Parser, 'Student', 'Teacher');

            console.log(`[${parserName}Parser] Start parsing (newHash: ${hash})...`);
            data = parser.run();

            console.log(`[${parserName}Parser] Start data processing...`);
        }

        if (Object.keys(data).length == 0) return false;

        const siteMinimalDayIndex: number = Math.min(...Object.entries(data).reduce<number[]>((bounds: number[], [, entry]): number[] => {
            for (const day of entry.days) {
                const dayIndex: number = DayIndex.fromStringDate(day.day).valueOf();
                if (bounds.includes(dayIndex)) continue;

                bounds.push(dayIndex);
            }

            return bounds;
        }, []));

        // Полная очистка
        if (this._clearKeys) {
            for (const index in cache.timetable) {
                if (!data[index]) {
                    delete cache.timetable[index];
                }
            }
        }

        const archiveDays: ArchiveAppendDay[] = [];

        // добавление новых данных
        for (const index in data) {
            const newEntry = data[index];
            const currentEntry = cache.timetable[index];

            if (!currentEntry) {
                cache.timetable[index] = data[index];
            } else {
                const { mergedDays, added, changed } = mergeDays(newEntry.days as any, currentEntry.days as any);

                const toArchive: (GroupDay | TeacherDay)[] = [...added, ...changed];
                if (toArchive.length > 0) {
                    archiveDays.push(...toArchive.map((day): ArchiveAppendDay => {
                        return onParser<ArchiveAppendDay>(Parser, {
                            type: 'group',
                            group: index,
                            day: day as GroupDay
                        }, {
                            type: 'teacher',
                            teacher: index,
                            day: day as TeacherDay
                        });
                    }));
                }

                for (const day of changed) {
                    const dayIndex = DayIndex.fromStringDate(day.day);

                    let eventName: keyof ParserEvents | undefined;

                    if (dayIndex.isToday()) {
                        //расписание на сегодня изменено

                        eventName = onParser<keyof ParserEvents>(Parser,
                            'updateGroupDay',
                            'updateTeacherDay'
                        );
                    } else if (dayIndex.isTomorrow()) {
                        //расписание на завтра изменилось

                        if (currentEntry.lastNoticedDay === dayIndex.valueOf()) {
                            //уже расписание было отправлено ранее, а значит поступили новые правки
                            eventName = onParser<keyof ParserEvents>(Parser,
                                'updateGroupDay',
                                'updateTeacherDay'
                            );
                        } else {
                            //новое расписание на завтра
                            eventName = onParser<keyof ParserEvents>(Parser,
                                'addGroupDay',
                                'addTeacherDay'
                            );
                        }
                    }

                    if (eventName) {
                        const eventData = onParser<GroupDayEvent | TeacherDayEvent>(Parser, {
                            day: day as GroupDay,
                            group: index
                        }, {
                            day: day as TeacherDay,
                            teacher: index
                        });

                        this.events.emit(eventName, eventData as any)
                    }
                }

                //test
                if (config.dev) {
                    if (changed.length > 0) {
                        console.log(`Для '${index}' были изменены дни:`, changed.map(day => {
                            return day.day
                        }))
                    }

                    if (added.length > 0) {
                        console.log(`Для '${index}' были добавлены дни:`, added.map(day => {
                            return day.day
                        }))
                    }
                }

                currentEntry.days = mergedDays as any;
            }
        }

        // удаление старых данных
        for (const index in cache.timetable) {
            const entry = cache.timetable[index];

            //удаление старых дней (удаляются дни, которые одновременно старше указанных на сайте и старше сегодняшнего дня)
            entry.days = (entry.days as any).filter((day: GroupDay | TeacherDay): boolean => {
                const dayIndex = DayIndex.fromStringDate(day.day);
                const keep: boolean = (dayIndex.isNotPast() || dayIndex.valueOf() >= siteMinimalDayIndex);

                if (!keep) {
                    archiveDays.push(onParser<ArchiveAppendDay>(Parser, {
                        type: 'group',
                        group: index,
                        day: day as GroupDay
                    }, {
                        type: 'teacher',
                        teacher: index,
                        day: day as TeacherDay
                    }));
                }

                return keep;
            }) as any;

            //удаление группы/учителя если все дни пустые и его нет в новых данных
            if (entry.days.length === 0 && data[index] === undefined) {
                delete cache.timetable[index];
            }
        }

        this.app.getService('timetable').appendDays(archiveDays);

        // проверка на то, что добавлена новая неделя
        const maxWeekIndex = Math.max(...(Object.values(cache.timetable) as (Group | Teacher)[])
            .map((entry) => {
                const weekIndexes = entry.days.map((day) => {
                    return WeekIndex.fromStringDate(day.day).valueOf();
                });

                return Math.max(...weekIndexes);
            })
        );

        // оповещение в чаты, что на сайте вывесили новую неделю
        if (cache.lastWeekIndex && maxWeekIndex > cache.lastWeekIndex) {
            const chatMode: ChatMode = onParser<ChatMode>(Parser, 'student', 'teacher');
            this.events.emit('updateWeek', chatMode, maxWeekIndex);
        }

        cache.lastWeekIndex = maxWeekIndex;
        cache.update = Date.now();

        return true;
    }

    private _cacheTeamCleared: boolean = false; //костыль, чтобы два раза не чистилось
    private async parseTeam(pageIndex: number, url: string, cache: TeamCache): Promise<boolean> {
        let data: Team;
        if (config.updater.localMode) {
            const file: any = JSON.parse(readFileSync(`./cache/rasp/team.json`, 'utf8'));

            data = file.team;
        } else {
            const jsdom = await this.getJSDOM(url);

            const parser = new TeamParser(jsdom.window);
            const hash = parser.getContentHash();

            if (!config.updater.ignoreHash && !this._forceParse && hash === cache.hash[pageIndex]) {
                cache.update = Date.now();
                return true;
            } else if (hash !== cache.hash[pageIndex]) {
                cache.changed = Date.now();
            }

            cache.hash[pageIndex] = hash;

            console.log(`[TeamParser: ${pageIndex}] Start parsing (newHash: ${hash})...`);
            data = parser.run();

            console.log(`[TeamParser: ${pageIndex}] Start data processing...`);
        }

        if (Object.keys(data).length == 0) return false;

        // Полная очистка
        if (this._clearKeys && !this._cacheTeamCleared) {
            this._cacheTeamCleared = true;
            for (const index in cache.names) {
                if (!data[index]) {
                    delete cache.names[index];
                }
            }
        }

        Object.assign(cache.names, data);
        cache.names = Object.keys(cache.names).sort().reduce<Team>(
            (obj, key) => {
                obj[key] = cache.names[key];
                return obj;
            }, {}
        );

        cache.update = Date.now();

        return true;
    }

    private async getJSDOM(url: string): Promise<JSDOM> {
        // let agent: Agents | undefined;

        if (config.updater.proxy) {
            //TODO PROXY AGENT
        }

        const response = await got({
            url: url,
            // agent: agent,
            headers: {
                'User-Agent': 'MGKE timetable bot by Keller (https://github.com/Keller18306/MgkeTimetableBot)'
            },
            retry: 0
        })

        return new JSDOM(response.body);
    }
}

export { raspCache }
