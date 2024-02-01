import { CronJob } from 'cron';
import db from '.';
import { Updater } from '../updater';
import { DayIndex } from '../utils';
import { vaccum } from './common';

export function vanish() {
    //clean storage larger then 30 days
    db.prepare('DELETE FROM storage WHERE time <= ?')
        .run(Math.ceil(Date.now() / 1e3) - (60 * 60 * 24 * 30));

    //clean timetable days larger then 365 days
    db.prepare('DELETE FROM timetable_archive WHERE day <= ?')
        .run(DayIndex.fromDate(new Date(Date.now() - (1e3 * 60 * 60 * 24 * 365))).valueOf());

    //TODO DELETE OLD CHATS

    vaccum();

    Updater.getInstance().archive.cleanCache();
}

export function startVanishCronJob() {
    /**
        Seconds: 0-59
        Minutes: 0-59
        Hours: 0-23
        Day of Month: 1-31
        Months: 0-11 (Jan-Dec)
        Day of Week: 0-6 (Sun-Sat)
    */
    
    //every first day of month
    new CronJob('0 0 0 1 * *', vanish, null, true).start();
}