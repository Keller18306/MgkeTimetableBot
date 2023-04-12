import { GroupDay, TeacherDay } from "../updater/parser/types";

function strToDate(day: string): Date {
    const parts = day.split('.').map(p => Number(p));

    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}Z+3UTC`);

    return date;
}

export function doCombine<T extends GroupDay | TeacherDay>(new_day: T[], old_day: T[]): T[] {
    const days: {
        [day: string]: T
    } = {}

    for (const _day of old_day) {
        days[_day.day] = _day
    }

    for (const _day of new_day) {
        days[_day.day] = _day
    }

    return Object.values(days)
}

export function collectDays(rasp_array: GroupDay[] | TeacherDay[]): string[] {
    const days: string[] = [];

    for (const rasp of rasp_array) {
        days.push(rasp.day)
    }

    return days;
}
