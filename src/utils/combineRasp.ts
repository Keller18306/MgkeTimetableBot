import { GroupDay, TeacherDay } from "../updater/parser/types";

/**
 * @description Перезаписывает старые дни, новыми, сохраняя старые неизменённые
 */
export function mergeDays<T extends GroupDay | TeacherDay>(new_days: T[], old_days: T[]): { mergedDays: T[], added: string[], changes: string[] } {
    const addedDays: string[] = [];
    const changedDays: string[] = [];
    const days: {
        [day: string]: T
    } = {};

    for (const _day of old_days) {
        days[_day.day] = _day;
    }

    for (const newDay of new_days) {
        const oldDay: T = days[newDay.day];

        if (oldDay === undefined) {
            addedDays.push(newDay.day);
        } else if (JSON.stringify(oldDay.lessons) !== JSON.stringify(newDay.lessons)) {
            changedDays.push(newDay.day);
        }

        days[newDay.day] = newDay;
    }

    return {
        mergedDays: Object.values(days),
        added: addedDays,
        changes: changedDays
    }
}

export function collectDays(rasp_array: GroupDay[] | TeacherDay[]): string[] {
    const days: string[] = [];

    for (const rasp of rasp_array) {
        days.push(rasp.day)
    }

    return days;
}
