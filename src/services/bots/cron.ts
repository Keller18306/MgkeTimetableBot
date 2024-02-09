import { CronJob } from "cron";
import { config } from "../../../config";
import { BotEventController } from "./events/controller";
import { App } from "../../app";

export class BotCron {
    private list: CronJob[] = [];

    constructor(private app: App) { }

    public run() {
        Object.entries(config.timetable.weekdays).forEach(([index, times]) => {
            this.register(Number(index), times, '1-5')
        })

        Object.entries(config.timetable.saturday).forEach(([index, times]) => {
            this.register(Number(index), times, '6')
        })
    }

    public async execute(index: number) {
        const events = this.app.getService('bot').events;

        return Promise.all([
            events.cronGroupDay({ index }),
            events.cronTeacherDay({ index })
        ]);
    }

    public stop() {
        for (const cron of this.list) {
            cron.stop();
        }

        this.list = []
    }

    private register(index: number, times: [[string, string], [string, string]], weekRange: string) {
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
        const job = new CronJob(`0 ${min} ${hour} * * ${weekRange}`, this.execute.bind(this, index), null, true);
        job.start();

        this.list.push(job);
    }
}