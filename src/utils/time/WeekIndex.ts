import { DayIndex, StringDate } from ".";
import { raspCache } from "../../services/parser";

const startingWeekIndexDate = new Date(1970, 0, 5);
const ONE_DAY: number = 24 * 60 * 60 * 1000;
const ONE_WEEK: number = 7 * ONE_DAY;

export class WeekIndex {
    public static now() {
        return this.fromDate(new Date());
    }

    public static getRelevant() {
        const date = new Date();

        let weekIndex: number = WeekIndex.fromDate(date).valueOf();
        if (date.getDay() === 0) {
            weekIndex += 1;
        }

        const relevant = Math.min(weekIndex, raspCache.teachers.lastWeekIndex, raspCache.groups.lastWeekIndex);

        return this.fromWeekIndexNumber(relevant);
    }

    public static fromStringDate(strDate: string | StringDate) {
        if (typeof strDate === 'string') {
            strDate = StringDate.fromStringDate(strDate);
        }

        return this.fromDate(strDate.toDate());
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
        const weekIndex = Math.floor(millisecondsElapsed / ONE_WEEK);

        return new this(weekIndex);
    }

    public static fromWeekIndexNumber(value: number) {
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
        return new Date((this.value * ONE_WEEK) + startingWeekIndexDate.getTime());
    }

    public getWeekRange(): [Date, Date] {
        const d1 = new Date((this.value * ONE_WEEK) + startingWeekIndexDate.getTime());
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

    public getNextWeekIndex(): WeekIndex {
        return WeekIndex.fromWeekIndexNumber(this.value + 1);
    }
}