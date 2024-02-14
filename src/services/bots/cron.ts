import { CronJob } from "cron";
import { config } from "../../../config";
import { BotEventController } from "./events/controller";
import { App } from "../../app";
import { CronDay } from "./events";

export class BotCron {
    private list: CronJob[] = [];

    constructor(private app: App) { }

    public run() {
        Object.entries(config.timetable.weekdays).forEach(([index, times], i, array) => {
            this.register({
                index: Number(index),
                latest: array.length === i + 1
            }, times, '1-5')
        })

        Object.entries(config.timetable.saturday).forEach(([index, times], i, array) => {
            this.register({
                index: Number(index),
                latest: array.length === i + 1
            }, times, '6')
        })
    }

    public async execute(data: CronDay) {
        const events = this.app.getService('bot').events;

        return Promise.all([
            events.cronGroupDay(data),
            events.cronTeacherDay(data)
        ]);
    }

    public stop() {
        for (const cron of this.list) {
            cron.stop();
        }

        this.list = []
    }

    private register(data: CronDay, times: [[string, string], [string, string]], weekRange: string) {
        const time: string = times[1][1];
        const [hour, min] = time.split(':', 2);

        /**
            Seconds: 0-59
            Minutes: 0-59
            Hours: 0-23
            Day of Month: 1-31
            Months: 0-11 (Jan-Dec)
            Day of Week: 0-6 (Sun-Sat)
        */
        const job = new CronJob(`0 ${min} ${hour} * * ${weekRange}`, this.execute.bind(this, data), null, true);
        job.start();

        this.list.push(job);
    }
}