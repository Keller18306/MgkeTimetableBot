import { config } from '../../config';
import { AbstractChat } from '../services/bots/abstract/chat';
import { Service } from '../services/bots/abstract/command';
import { GroupDay, TeacherDay } from '../updater/parser/types';
import { RaspCache } from '../updater/raspCache';
import { ScheduleFormatter } from './formatters/abstract';
import { DefaultScheduleFormatter } from './formatters/default';
import { VisualScheduleFormatter } from './formatters/visual';
import { getIsSaturday, getTodayDate, nowInTime, strDateToNumber } from './time';

export const SCHEDULE_FORMATTERS = [
    DefaultScheduleFormatter, VisualScheduleFormatter
];

export function createScheduleFormatter(service: Service, raspCache: RaspCache, chat?: AbstractChat): ScheduleFormatter {
    if (!chat) {
        return new DefaultScheduleFormatter(service, raspCache, chat);
    }

    if (chat.scheduleFormatter > SCHEDULE_FORMATTERS.length - 1) {
        chat.scheduleFormatter = 0;
    }

    const Formatter = SCHEDULE_FORMATTERS[chat.scheduleFormatter];
    
    return new Formatter(service, raspCache, chat);
}

export function removePastDays<T extends GroupDay | TeacherDay>(days: T[], processAutoskip: boolean = true): T[] {
    const isSaturday: boolean = getIsSaturday();
    const todayDate: number = getTodayDate();

    const dayIndex: number = days.findIndex(_ => {
        return strDateToNumber(_.day) >= todayDate;
    });

    if (dayIndex === -1) {
        throw new Error('nearest day not found')
    }

    const nextDays: T[] = days.slice(dayIndex);

    if (processAutoskip) {
        //current day ended
        const currentDay = nextDays[0];
        const timetable = config.timetable[isSaturday ? 'saturday' : 'weekdays'];
        let todayLessons: number = currentDay.lessons.length;
        if (!todayLessons || todayLessons > timetable.length) {
            todayLessons = timetable.length;
        }

        const lastLessonTime: string = timetable[todayLessons - 1][1][1];

        if (
            strDateToNumber(currentDay.day) === todayDate &&
            !nowInTime(isSaturday ? [6] : [1, 2, 3, 4, 5], '00:00', lastLessonTime)
        ) {
            nextDays.splice(0, 1);
        }
    }

    return nextDays;
}

export function getDayRasp<T extends GroupDay | TeacherDay>(days: T[], processAutoskip: boolean = true): T[] {
    const nextDays: T[] = removePastDays(days, processAutoskip);
    const showDays: T[] = [];

    showDays.push(nextDays[0]);

    if (nextDays.length > 1) {
        showDays.push(nextDays[1]);
    }

    return showDays;
}

export function getDayNext<T extends GroupDay | TeacherDay>(days: T[]): T | null {
    const todayDate: number = getTodayDate();

    const dayIndex: number = days.findIndex(_ => {
        return strDateToNumber(_.day) > todayDate;
    });

    if (dayIndex === -1) {
        return null;
    }

    const nextDays = days.slice(dayIndex);

    return nextDays[0];
}