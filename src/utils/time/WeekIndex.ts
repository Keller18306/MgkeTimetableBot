import { DayIndex, parseStrToDate } from ".";

const startingWeekIndexDate = new Date(1970, 0, 5);
const ONE_DAY: number = 24 * 60 * 60 * 1000;
const oneWeekMilliseconds = 7 * 24 * 60 * 60 * 1000;

export class WeekIndex {
    public static now() {
        return this.fromDate(new Date());
    }

    public static fromStringDate(strDate: string) {
        return this.fromDate(parseStrToDate(strDate));
    }

    public static fromDayIndex(dayIndex: number | DayIndex) {
        if (typeof dayIndex === 'number') {
            dayIndex = DayIndex.fromNumber(dayIndex);
        }

        return this.fromDate(dayIndex.toDate());
    }

    public static fromDate(date: Date) {
        // Корректировка для воскресенья
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) { // Воскресенье
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
        }

        const millisecondsElapsed = date.getTime() - startingWeekIndexDate.getTime();
        const weekIndex = Math.floor(millisecondsElapsed / oneWeekMilliseconds);

        return new this(weekIndex);
    }

    public static fromNumber(value: number) {
        return new this(value);
    }

    private constructor(private value: number) { }

    public valueOf(): number {
        return this.value;
    }

    public toString(): string {
        return String(this.value);
    }

    public getFirstDayDate() {
        return new Date((this.value * oneWeekMilliseconds) + startingWeekIndexDate.getTime());
    }

    public getWeekRange(): [Date, Date] {
        const d1 = new Date((this.value * oneWeekMilliseconds) + startingWeekIndexDate.getTime());
        const d2 = new Date(d1.getTime() + ONE_DAY * 6);

        return [d1, d2];
    }

    public getWeekDayIndexRange(): [number, number] {
        const [d1, d2] = this.getWeekRange();

        return [
            DayIndex.fromDate(d1).valueOf(),
            DayIndex.fromDate(d2).valueOf()
        ];
    }

    public isFutureWeek(): boolean {
        const todayIndex = WeekIndex.now().valueOf();

        return this.value > todayIndex;
    }
}