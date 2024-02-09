import { CronJob } from 'cron';
import db from '.';
import { App } from '../app';
import { DayIndex } from '../utils';
import { vaccum } from './common';

export function vanish(app: App) {
    //clean storage
    db.prepare('DELETE FROM storage WHERE expires != 0 AND expires < ?')
        .run(Math.ceil(Date.now() / 1e3));

    //clean timetable days larger then 5 years
    db.prepare('DELETE FROM timetable_archive WHERE day <= ?')
        .run(DayIndex.fromDate(new Date(Date.now() - (1e3 * 60 * 60 * 24 * 365 * 5))).valueOf());

    //TODO DELETE OLD CHATS

    vaccum();

    app.getService('timetable').resetCache();
}

export function startVanishCronJob(app: App) {
    /**
        Seconds: 0-59
        Minutes: 0-59
        Hours: 0-23
        Day of Month: 1-31
        Months: 0-11 (Jan-Dec)
        Day of Week: 0-6 (Sun-Sat)
    */

    //every first day of month
    new CronJob('0 0 0 1 * *', () => vanish(app), null, true).start();
}