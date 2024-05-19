import { CronJob } from 'cron';
import { Op } from 'sequelize';
import { sequelize } from '.';
import { App } from '../app';
import { StorageModel } from '../services/bots/storage/model';
import { TimetableArchive } from '../services/timetable/models/timetable';
import { DayIndex } from '../utils';

export async function vanish(app: App) {
    //clean storage
    await StorageModel.destroy({
        where: {
            expiresAt: {
                [Op.ne]: 0,
                [Op.lt]: Math.ceil(Date.now() / 1e3)
            }
        }
    })

    //clean timetable days larger then 5 years
    await TimetableArchive.destroy({
        where: {
            day: {
                [Op.lte]: DayIndex.fromDate(new Date(Date.now() - (1e3 * 60 * 60 * 24 * 365 * 5))).valueOf()
            }
        }
    });

    //TODO DELETE OLD CHATS

    await sequelize.query('VACUUM');
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