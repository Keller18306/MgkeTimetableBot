import { parseStrToDate } from ".";

export class DayIndex {
    public static now() {
        return this.fromDate(new Date());
    }

    public static fromStringDate(strDate: string) {
        return this.fromDate(parseStrToDate(strDate));
    }

    public static fromDate(date: Date) {
        date = new Date(date);
        date.setHours(0, 0, 0, 0);

        const dayIndex = (date.getTime() + (Math.abs(date.getTimezoneOffset()) * 60 * 1e3)) / 1e3 / 24 / 60 / 60;

        return new this(dayIndex);
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

    public toDate(): Date {
        return new Date(this.valueOf() * 1e3 * 24 * 60 * 60);
    }

    public isToday(): boolean {
        const todayIndex = DayIndex.now().valueOf();

        return todayIndex === this.value;
    }

    public isTomorrow(): boolean {
        const todayIndex = DayIndex.now().valueOf();

        return todayIndex + 1 === this.value;
    }

    public isNotPast(): boolean {
        const todayIndex = DayIndex.now().valueOf();

        return this.value >= todayIndex;
    }

    public isFuture(): boolean {
        const todayIndex = DayIndex.now().valueOf();

        return this.value > todayIndex;
    }

    public isPast(): boolean {
        const todayIndex = DayIndex.now().valueOf();

        return this.value < todayIndex;
    }
}