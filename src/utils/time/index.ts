import { config } from '../../../config';

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

export interface DelayObject {
    promise: Promise<void>,
    resolve: () => void
}

function createDelayPromise(ms: number): DelayObject {
    let resolveFunc: (() => void) | undefined;

    const promise = new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, ms);

        resolveFunc = () => {
            clearTimeout(timeout);
            resolve()
        }
    });

    if (!resolveFunc) {
        throw new Error('something went wrong')
    };

    return {
        promise,
        resolve: resolveFunc
    }
}

export function getDelayTime(error: boolean = false): DelayObject {
    if (error) return createDelayPromise(config.parser.update_interval.error * 1e3)

    // во время локального тестирования - 3 секунды
    if (config.parser.localMode) {
        return createDelayPromise(3e3);
    }

    const date = new Date()
    const hour = date.getHours()

    //в воскресенье не нужно часто
    if (date.getDay() !== 0 && config.parser.activity[0] <= hour && hour <= config.parser.activity[1]) {
        return createDelayPromise(config.parser.update_interval.activity * 1e3)
    }

    //фикс для убирания задержки во время активности
    const startHour = (config.parser.activity[0] - Math.ceil(config.parser.update_interval.default / (1 * 60 * 60)))
    if (hour >= startHour && hour <= config.parser.activity[0]) {
        const endTime = new Date(date.getTime() + config.parser.update_interval.default * 1e3)

        if (endTime.getHours() >= config.parser.activity[0]) {
            endTime.setHours(config.parser.activity[0])
            endTime.setMinutes(0)
            endTime.setSeconds(0)
            endTime.setMilliseconds(0)

            return createDelayPromise(
                Math.max(0, endTime.getTime() - date.getTime())
            )
        }
    }

    return createDelayPromise(config.parser.update_interval.default * 1e3)
}

export * from './DayIndex';
export * from './StringDate';
export * from './WeekIndex';
