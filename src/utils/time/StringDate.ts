import { DayIndex } from "./DayIndex";

export class StringDate {
    public static now() {
        return this.fromDate(new Date());
    }

    public static fromStringDate(strDate: string, utc: boolean = false) {
        const date = new Date();

        const parts = strDate.split('.').map((value: string): number => {
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

        return new this(date);
    }

    public static fromDayIndex(dayIndex: number | DayIndex) {
        if (typeof dayIndex === 'number') {
            dayIndex = DayIndex.fromNumber(dayIndex);
        }

        return this.fromDate(dayIndex.toDate());
    }

    public static fromUnixTime(unixTimestamp: number | bigint) {
        return new this(new Date(Number(unixTimestamp)));
    }

    public static fromDate(date: Date) {
        return new this(date);
    }

    constructor(private date: Date) { }

    public valueOf(): number {
        return this.date.getTime();
    }

    public toString(): string {
        return this.toStringDate();
    }

    public toDate(): Date {
        return this.date;
    }

    public getWeekdayName(): string {
        const days: string[] = [
            'Воскресенье',
            'Понедельник',
            'Вторник',
            'Среда',
            'Четверг',
            'Пятница',
            'Суббота'
        ];

        return days[this.date.getDay()];
    }

    public isSaturday(): boolean {
        return this.date.getDay() === 6;
    }

    public isSunday(): boolean {
        return this.date.getDay() === 0;
    }

    public toStringDate(): string {
        const date = this.date;

        return `${date.getDate().toString().padStart(2, '0')}.` +
            `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
            `${date.getFullYear()}`;
    }

    public toStringTime(microtime: boolean = false): string {
        const date = this.date;

        return `${date.getHours().toString().padStart(2, '0')}:` +
            `${date.getMinutes().toString().padStart(2, '0')}:` +
            `${date.getSeconds().toString().padStart(2, '0')}` +
            (microtime ? `,${date.getMilliseconds().toString().padStart(3, '0')}` : '');
    }

    public toStringDateTime(microtime: boolean = false): string {
        return this.toStringDate() + ' ' + this.toStringTime(microtime);
    }
}