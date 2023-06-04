import { config } from "../../config"
import { clearOldImages } from "../services/image/clear"
import { EventController } from "./events/controller"
import { NextDayUpdater } from "./nextDay"
import { loadCache, raspCache, saveCache } from "./raspCache"
import updateGroups from "./updateGroups"
import updateTeachers from "./updateTeachers"

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

    public forceParse() {
        this.delayPromise?.resolve();
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

        this.removeOldLogs()

        this.delayPromise = this.getDelayTime(error);
        await this.delayPromise.promise;
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
        for (const log of this.logs.slice(0, LOG_COUNT_SEND)) {
            if (!(log instanceof Error)) {
                return;
            }

            const current: string = log.result.toString();
            if (!val) {
                val = current
            }

            if (val === current) {
                hits++
            }
        }

        if (!val) {
            return;
        }

        if (hits === LOG_COUNT_SEND) {
            EventController.sendError(val);
        }
    }

    private async update() {
        return new Promise<number>(async (resolve, reject) => {
            const timeout = setTimeout(reject, 60e3)

            let ms: number;
            try {
                const startTime: number = Date.now()

                const res = await this.parse()

                const updateTime: number = Date.now()
                clearTimeout(timeout)

                await clearOldImages()

                if (!res[0] || !res[1]) {
                    throw new Error(`timetable is empty {groups:${res[0]},teachers:${res[1]}}`)
                }

                ms = updateTime - startTime
            } catch (e) {
                return reject(e)
            }

            saveCache()
            resolve(ms)
        })
    }

    private async parse(): Promise<boolean[]> {
        const callStack: [(...args: any) => Promise<boolean>, any[]][] = [
            [updateGroups, [raspCache.groups]],
            [updateTeachers, [raspCache.teachers]]
        ]

        const promises: Promise<boolean>[] = []
        for (const [func, args] of callStack) {
            const result: Promise<boolean> = func.call(null, ...args)
            promises.push(result)

            if (config.parseSyncMode) {
                await result;
            }
        }

        return Promise.all(promises);
    }
}

export { raspCache }

