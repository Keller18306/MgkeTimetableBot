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

export * from './DayIndex';
export * from './StringDate';
export * from './WeekIndex';
