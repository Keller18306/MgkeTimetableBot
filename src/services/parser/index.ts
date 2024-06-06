import { readFileSync } from "fs"
import got from "got"
import { JSDOM } from "jsdom"
import { config } from "../../../config"
import { App, AppService } from "../../app"
import { Logger } from "../../logger"
import { DayIndex, DelayObject, WeekIndex, getDelayTime, mergeDays } from "../../utils"
import { TypedEventEmitter } from "../../utils/events"
import { ChatMode } from "../bots/chat"
import { clearOldImages } from "../image/clear"
import { ArchiveAppendDay } from "../timetable"
import StudentParser from "./group"
import { RaspEntryCache, TeamCache, loadCache, raspCache, saveCache } from './raspCache'
import TeacherParser from "./teacher"
import TeamParser from "./team"
import { Group, GroupDay, Groups, Teacher, TeacherDay, Teachers, Team } from './types'

const MAX_LOG_LIMIT: number = 10;
const LOG_COUNT_SEND: number = 3;

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

    flushCache: [days: ArchiveAppendDay[]]

    error: [error: Error];
}

export class ParserService implements AppService {
    public events: TypedEventEmitter<ParserEvents>;
    public logger: Logger = new Logger('Parser');

    private logs: { date: Date, result: string | Error }[] = [];
    private delayPromise?: DelayObject;

    private _forceParse: boolean = false;
    private _clearKeys: boolean = false;

    constructor(private app: App) {
        loadCache();

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

    public run() {
        if (config.parser.enabled) {
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

    public forceLoopParse(clearKeys: boolean = false) {
        this._forceParse = true;
        this._clearKeys = clearKeys;
        this.delayPromise?.resolve();
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
            const { error } = await this.parse();

            this.delayPromise = getDelayTime(error);
            await this.delayPromise.promise;
        }
    }

    public async parse() {
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

        return { error }
    }

    public async flushCache() {
        const flushLessons: ArchiveAppendDay[] = [];

        for (const [group, { days }] of Object.entries(raspCache.groups.timetable)) {
            flushLessons.push(...days.map((day): ArchiveAppendDay => {
                return {
                    type: 'group',
                    value: group,
                    day: day
                }
            }));
        }

        for (const [teacher, { days }] of Object.entries(raspCache.teachers.timetable)) {
            flushLessons.push(...days.map((day): ArchiveAppendDay => {
                return {
                    type: 'teacher',
                    value: teacher,
                    day: day
                }
            }));
        }

        await this.events.emitAsync('flushCache', flushLessons);
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
                console.error('Parser error', e);
                return reject(e);
            }

            resolve(ms);
        })
    }

    private async runActions(): Promise<boolean[]> {
        if (config.dev && !config.parser.localMode) {
            // Перезагружаем данные из файла, если мы в режиме разработки.
            // Используется для тестирования оповещений о изменениях в днях 
            loadCache();
        }

        const PARSER_ACTIONS = [
            this.parseTimetable.bind(
                this, StudentParser, encodeURI(config.parser.endpoints.timetableGroup), raspCache.groups
            ),

            this.parseTimetable.bind(
                this, TeacherParser, encodeURI(config.parser.endpoints.timetableTeacher), raspCache.teachers
            )
        ];

        //парсим страницы реже
        if (
            this._forceParse || this._clearKeys || config.parser.localMode || !raspCache.team.update ||
            Date.now() - raspCache.team.update >= config.parser.update_interval.teams * 1e3
        ) {
            for (const i in config.parser.endpoints.team) {
                const url = config.parser.endpoints.team[i];

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

            if (config.parser.syncMode) {
                await result;
            }
        }

        return Promise.all(promises);
    }

    private async parseTimetable(Parser: typeof TeacherParser | typeof StudentParser, url: string, cache: RaspEntryCache<Teachers | Groups>) {
        const logger = this.logger.extend(onParser<string>(Parser, 'Student', 'Teacher'));

        let data: Teachers | Groups;
        if (config.parser.localMode) {
            const fileName: string = onParser<string>(Parser, 'groups', 'teachers');
            const file: any = JSON.parse(readFileSync(`./cache/rasp/${fileName}.json`, 'utf8'));

            data = file.timetable;
        } else {
            const jsdom = await this.getJSDOM(url);

            const parser = new Parser(jsdom.window);
            const hash = parser.getContentHash();

            if (!config.parser.ignoreHash && !this._forceParse && hash === cache.hash) {
                cache.update = Date.now();
                return true;
            } else if (hash !== cache.hash) {
                cache.changed = Date.now();
            }

            cache.hash = hash;

            logger.log(`Парсинг данных (newHash: ${hash})...`);
            data = parser.run();
            logger.log('Обработка данных...');
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

        const flushLessons: ArchiveAppendDay[] = [];

        // добавление новых данных
        for (const index in data) {
            const newEntry = data[index];
            const currentEntry = cache.timetable[index];

            let toArchive: (GroupDay | TeacherDay)[] = [];

            if (!currentEntry) {
                cache.timetable[index] = data[index];

                toArchive.push(...data[index].days);
            } else {
                const { mergedDays, added, changed } = mergeDays(newEntry.days as any, currentEntry.days as any);

                toArchive = [...added, ...changed];

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
                        logger.log(`Для '${index}' были изменены дни:`, changed.map(day => {
                            return day.day;
                        }));
                    }

                    if (added.length > 0) {
                        logger.log(`Для '${index}' были добавлены дни:`, added.map(day => {
                            return day.day;
                        }));
                    }
                }

                currentEntry.days = mergedDays as any;
            }

            if (toArchive.length > 0) {
                flushLessons.push(...toArchive.map((day): ArchiveAppendDay => {
                    return onParser<ArchiveAppendDay>(Parser, {
                        type: 'group',
                        value: index,
                        day: day as GroupDay
                    }, {
                        type: 'teacher',
                        value: index,
                        day: day as TeacherDay
                    });
                }));
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
                    flushLessons.push(onParser<ArchiveAppendDay>(Parser, {
                        type: 'group',
                        value: index,
                        day: day as GroupDay
                    }, {
                        type: 'teacher',
                        value: index,
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

        await this.events.emitAsync('flushCache', flushLessons);

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
        const logger = this.logger.extend(`Team:${pageIndex}`);

        let data: Team;
        if (config.parser.localMode) {
            const file: TeamCache = JSON.parse(readFileSync(`./cache/rasp/team.json`, 'utf8'));

            data = file.names;
        } else {
            const jsdom = await this.getJSDOM(url);

            const parser = new TeamParser(jsdom.window);
            const hash = parser.getContentHash();

            if (!config.parser.ignoreHash && !this._forceParse && hash === cache.hash[pageIndex]) {
                cache.update = Date.now();
                return true;
            } else if (hash !== cache.hash[pageIndex]) {
                cache.changed = Date.now();
            }

            cache.hash[pageIndex] = hash;

            logger.log(`Парсинг данных (newHash: ${hash})...`);
            data = parser.run();
            logger.log('Обработка данных...');
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

        if (config.parser.proxy) {
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

