import { raspCache } from "../updater";

const startingWeekIndexDate = new Date(1970, 0, 5);

export function seconds2times(seconds: number, values: number = 3) {
    let times = [];
    let count_zero = false;
    let periods = [60, 60 * 60, 60 * 60 * 24, 60 * 60 * 24 * 365];
    let period = 0;

    for (let i = values; i >= 0; i--) {
        period = Math.floor(seconds / periods[i]);

        if ((period > 0) || (period === 0 && count_zero)) {
            times[i + 1] = period;
            seconds -= period * periods[i];
            count_zero = true;
        }
    }

    times[0] = seconds;

    return times;
}

export function formatSeconds(sec: number, limit: number | null = null) {
    let end = [];
    let times_values = ['сек.', 'мин.', 'ч.', 'д.', 'г.'];
    let times = seconds2times(sec);
    let ti = 0;

    for (let i = times.length - 1; i >= 0; i--) {
        ti++;
        if (limit != null && ti > limit) break;
        end.push(times[i] + ' ' + times_values[i]);
    }

    return end.join(' ');
}

export function formatDateTime(date: Date, microtime: boolean = false): string {
    return formatDate(date) + ' ' +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}` +
        (microtime ? `,${date.getMilliseconds().toString().padStart(3, '0')}` : '');
}

export function formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}.` +
        `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
        `${date.getFullYear()}`;
}

export function getDayIndex(date?: Date): number {
    if (!date) {
        date = new Date();
    }

    date.setHours(0, 0, 0, 0);


    return (date.getTime() + (Math.abs(date.getTimezoneOffset()) * 60 * 1e3)) / 1e3 / 24 / 60 / 60;
}

export function getWeekIndex(date?: Date): number {
    if (!date) {
        date = new Date();
    }

    // Корректировка для воскресенья
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Воскресенье
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    }

    const oneWeekMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const millisecondsElapsed = date.getTime() - startingWeekIndexDate.getTime();
    const weekNumber = Math.floor(millisecondsElapsed / oneWeekMilliseconds);

    return weekNumber;
}

export function parseStrToDate(str_date: string, utc: boolean = false): Date {
    const date = new Date();

    const parts = str_date.split('.').map((value: string): number => {
        return Number(value);
    }).slice(0, 3).reverse() as [number, number, number];

    parts[1] -= 1; //js format

    if (utc) {
        date.setUTCFullYear(...parts);
        date.setUTCHours(0, 0, 0, 0);
    } else {
        date.setFullYear(...parts);
        date.setHours(0, 0, 0, 0);
    }

    return date;
}

export function strDateToIndex(str_date: string): number {
    const date = parseStrToDate(str_date, true);

    return date.getTime() / 1e3 / 24 / 60 / 60;
}

export function dayIndexToDate(dayIndex: number): Date {
    return new Date(dayIndex * 1e3 * 24 * 60 * 60);
}

export function getStrWeekIndex(str_date: string): number {
    const date = parseStrToDate(str_date);

    return getWeekIndex(date);
}

export function isToday(str_date: string): boolean {
    const todayIndex = getDayIndex();
    const dayIndex = strDateToIndex(str_date);

    return todayIndex === dayIndex;
}

export function isTomorrow(str_date: string): boolean {
    const todayIndex = getDayIndex() + 1;
    const dayIndex = strDateToIndex(str_date);

    return todayIndex === dayIndex;
}

export function isNextWeek(str_date: string): boolean {
    const todayWeekNumber = getWeekIndex();
    const weekNumber = getStrWeekIndex(str_date);

    return weekNumber > todayWeekNumber;
}

export function getIsSaturday(): boolean {
    return new Date().getDay() === 6;
}

export function nowInTime(includedDays: number[], timeFrom: string, timeTo: string): boolean {
    const partsFrom = timeFrom.split(':');
    const hoursFrom = Number(partsFrom[0]);
    const minutesFrom = Number(partsFrom[1]) + (hoursFrom * 60);

    const partsTo = timeTo.split(':');
    const hoursTo = Number(partsTo[0]);
    const minutesTo = Number(partsTo[1]) + (hoursTo * 60);

    const date = new Date();

    const hoursNow = date.getHours();
    const minutesNow = date.getMinutes() + (hoursNow * 60);

    if (
        (includedDays.includes(date.getDay())) &&
        (minutesNow >= minutesFrom && minutesNow <= minutesTo)
    ) {
        return true;
    } else {
        return false;
    }
}

const ONE_DAY: number = 24 * 60 * 60 * 1000;
const oneWeekMilliseconds = 7 * 24 * 60 * 60 * 1000;

export function weekFirstDayByWeekIndex(weekIndex: number): Date {
    const d1 = new Date((weekIndex * oneWeekMilliseconds) + startingWeekIndexDate.getTime());

    return d1;
}

export function weekBoundsByWeekIndex(weekIndex: number): [Date, Date] {
    const d1 = new Date((weekIndex * oneWeekMilliseconds) + startingWeekIndexDate.getTime());
    const d2 = new Date(d1.getTime() + ONE_DAY * 6);

    return [d1, d2];
}

export function getWeekdayName(date: Date): string {
    const days: string[] = [
        'Воскресенье',
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота'
    ];

    return days[date.getDay()];
}

export function getWeekdayNameByStrDate(str_date: string): string {
    return getWeekdayName(parseStrToDate(str_date))
}

export function getCurrentWeekIndexToShow() {
    const date = new Date();

    let weekIndex: number = getWeekIndex(date);
    if (date.getDay() === 0) {
        weekIndex += 1;
    }

    return Math.min(weekIndex, raspCache.teachers.lastWeekIndex);
}