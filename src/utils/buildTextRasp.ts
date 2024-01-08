import { config } from '../../config';
import { AbstractChat } from '../services/bots/abstract/chat';
import { Service } from '../services/bots/abstract/command';
import { GroupDay, TeacherDay } from '../updater/parser/types';
import { RaspCache } from '../updater/raspCache';
import { ScheduleFormatter } from './formatters/abstract';
import { DefaultScheduleFormatter } from './formatters/default';
import { VisualScheduleFormatter } from './formatters/visual';
import { DayIndex, StringDate, nowInTime } from './time';

export const SCHEDULE_FORMATTERS = [
    DefaultScheduleFormatter, VisualScheduleFormatter
];

export function createScheduleFormatter(service: Service, raspCache: RaspCache, chat: AbstractChat): ScheduleFormatter {
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
    const isSaturday: boolean = StringDate.now().isSaturday();

    const dayIndex: number = days.findIndex(_ => {
        return DayIndex.fromStringDate(_.day).isNotPast();
    });

    if (dayIndex === -1) {
        return [];
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
            DayIndex.fromStringDate(currentDay.day).isToday() &&
            !nowInTime(isSaturday ? [6] : [1, 2, 3, 4, 5], '00:00', lastLessonTime)
        ) {
            nextDays.splice(0, 1);
        }
    }

    return nextDays;
}

export function getDayRasp<T extends GroupDay | TeacherDay>(days: T[], processAutoskip: boolean = true, maxDays: number = 1): T[] {
    const nextDays: T[] = removePastDays(days, processAutoskip);
    const showDays: T[] = [];

    if (nextDays.length === 0) {
        return [];
    }

    showDays.push(nextDays[0]);

    if (maxDays > 1) {
        for (let i = 1; i < maxDays; i++) {
            const day = nextDays[i];
            if (!day) break;

            showDays.push(day);
        }
    }

    return showDays;
}

export function getFutureDays<T extends GroupDay | TeacherDay>(days: T[]): T[] {
    const dayIndex: number = days.findIndex(_ => {
        return DayIndex.fromStringDate(_.day).isFuture();
    });

    if (dayIndex === -1) {
        return [];
    }

    const nextDays = days.slice(dayIndex);

    return nextDays;
}

export function getFutureDay<T extends GroupDay | TeacherDay>(days: T[]): T | null {
    const nextDays = getFutureDays(days);

    return nextDays[0] || null;
}