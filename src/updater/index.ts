import { JSDOM } from "jsdom"
import { config } from "../../config"
import { ChatMode } from "../services/bots/abstract"
import { clearOldImages } from "../services/image/clear"
import { doCombine, getDayIndex, getStrWeekIndex, getWeekIndex, strDateToIndex } from "../utils"
import { EventController } from "./events/controller"
import { NextDayUpdater } from "./nextDay"
import StudentParser from "./parser/group"
import TeacherParser from "./parser/teacher"
import { Group, Teacher } from "./parser/types"
import { RaspGroupCache, RaspTeacherCache, loadCache, raspCache, saveCache } from "./raspCache"

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

export class Updater {
    private static instance?: Updater;

    public static getInstance() {
        if (!this.instance) this.instance = new Updater();

        return this.instance
    }

    private logs: { date: Date, result: string | Error }[] = [];
    private delayPromise?: Delay;
    private clearKeys: boolean = false;

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

    public start() {
        loadCache()

        this.run()

        new NextDayUpdater().register()
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
        this.clearKeys = clearKeys;
        this.delayPromise?.resolve();
    }

    private getDelayTime(error: boolean = false): Delay {
        if (error) return createDelayPromise(config.updater.update_interval.error * 1e3)

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
            EventController.sendError(error);
        }
    }

    private async run() {
        while (true) {
            await this.runParse()
        }
    }

    private async runParse() {
        let error: boolean = false;

        try {
            const ms = await this.update();

            raspCache.successUpdate = true

            this.log(`success: ${ms}ms`)
        } catch (e: any) {
            raspCache.successUpdate = false
            error = true;

            console.error('update error', e)
            this.log(e)
        }

        this.clearKeys = false;
        this.removeOldLogs();

        this.delayPromise = this.getDelayTime(error);
        await this.delayPromise.promise;
    }

    private async update() {
        return new Promise<number>(async (resolve, reject) => {
            const timeout = setTimeout(reject, 60e3);

            let ms: number;
            try {
                const startTime: number = Date.now();

                const res = await this.parse();

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

            saveCache();
            resolve(ms);
        })
    }

    private async parse(): Promise<boolean[]> {
        const PARSER_ACTIONS = [
            {
                parser: StudentParser,
                url: encodeURI('https://mgkct.minskedu.gov.by/персоналии/учащимся/расписание-занятий-на-неделю'),
                cache: raspCache.groups
            },
            {
                parser: TeacherParser,
                url: encodeURI('https://mgkct.minskedu.gov.by/персоналии/преподавателям/расписание-занятий-на-неделю'),
                cache: raspCache.teachers
            }
        ];

        const promises: Promise<boolean>[] = [];
        for (const action of PARSER_ACTIONS) {
            const result: Promise<boolean> = this.processParse(action.parser, action.url, action.cache);
            promises.push(result)

            if (config.parseSyncMode) {
                await result;
            }
        }

        return Promise.all(promises);
    }

    private async processParse(Parser: typeof TeacherParser | typeof StudentParser, url: string, cache: RaspGroupCache | RaspTeacherCache) {
        const date = new Date();
        const todayIndex = getDayIndex(date);

        //console.log('[Parser - Groups] Start parsing')
        const jsdom = await JSDOM.fromURL(url, {
            userAgent: 'MGKE bot by Keller'
        });

        const parser = new Parser(jsdom.window);

        const data = await parser.run();
        if (Object.keys(data).length == 0) return false;

        const siteMinimalDayIndex: number = Math.min(...Object.entries(data).reduce<number[]>((bounds: number[], [, entry]): number[] => {
            for (const day of entry.days) {
                const date: number = strDateToIndex(day.day);
                if (bounds.includes(date)) continue;

                bounds.push(date);
            }

            return bounds;
        }, []));

        //TODO сделать оповещения в чаты, когда изменения на день поступили
        //const dump = Object.assign({}, rasp.timetable);

        // Полная очистка
        if (this.clearKeys) {
            for (const index in cache.timetable) {
                if (!data[index]) {
                    delete cache.timetable[index];
                }
            }
        }

        // добавление новых данных
        for (const index in data) {
            const newEntry = data[index];
            const currentEntry = cache.timetable[index];

            if (!currentEntry) {
                cache.timetable[index] = data[index];
            } else {
                currentEntry.days = doCombine(newEntry.days as any, currentEntry.days as any || []) as any;
            }
        }

        // удаление старых данных
        for (const index in cache.timetable) {
            const entry = cache.timetable[index];

            //удаление старых дней (удаляются дни, которые старше указанных на сайте и старше сегодняшнего дня)
            entry.days = (entry.days as any).filter((day: any) => {
                const dayIndex: number = strDateToIndex(day.day);

                return (dayIndex >= todayIndex || dayIndex >= siteMinimalDayIndex);
            }) as any;

            //удаление группы/учителя если все дни пустые и его нет в новых данных
            if (entry.days.length === 0 && data[index] === undefined) {
                delete cache.timetable[index];
            }
        }

        // проверка на то, что добавлена новая неделя
        const maxWeekNumber = Math.max(...(Object.values(cache.timetable) as (Group | Teacher)[])
            .map((entry) => {
                const weekNumbers = entry.days.map((day) => {
                    return getStrWeekIndex(day.day);
                });

                return Math.max(...weekNumbers);
            })
        );

        if (cache.lastWeekIndex && maxWeekNumber > getWeekIndex(date)) {
            let chatMode: ChatMode | undefined;

            if (Parser instanceof StudentParser) {
                chatMode = 'student';
            }

            if (Parser instanceof TeacherParser) {
                chatMode = 'teacher';
            }

            if (chatMode) {
                EventController.sendNextWeek(chatMode)
            }
        }

        cache.lastWeekIndex = maxWeekNumber;
        cache.update = Date.now();

        return true;
    }
}

export { raspCache }