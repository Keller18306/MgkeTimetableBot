import { config } from "../../config"
import { clearOldImages } from "../services/image/clear"
import { NextDayUpdater } from "./nextDay"
import { loadCache, raspCache, saveCache } from "./raspCache"
import updateGroups from "./updateGroups"
import updateTeachers from "./updateTeachers"

function createDelayPromise(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export class Updater {
    private static instance?: Updater;

    public static getInstance() {
        if (!this.instance) this.instance = new Updater();

        return this.instance
    }

    private logsLimit: number = 30;
    private logs: { date: Date, result: string | Error}[] = [];

    public getLogs() {
        return this.logs.slice()
    }

    public clearAllLogs() {
        this.logs = []
    }

    public removeOldLogs() {
        if (this.logs.length <= this.logsLimit) return false;

        this.logs.splice(0, this.logs.length - this.logsLimit)

        return true
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

    private async run() {
        while (true) {
            try {
                const [ms] = await Promise.all([
                    this.update(),
                    this.delayTime(false)
                ])

                raspCache.successUpdate = true

                this.log(`success: ${ms}ms`)
            } catch (e: any) {
                raspCache.successUpdate = false

                this.log(e)

                console.error('update error', e)

                await this.delayTime(true)
            }

            this.removeOldLogs()
        }
    }

    private delayTime(error: boolean = false): Promise<void> {
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
        this.logs.push({
            date: new Date(),
            result: log
        })
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

