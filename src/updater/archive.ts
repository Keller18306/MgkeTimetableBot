import db from "../db";
import { dayIndexToDate, formatDate, getDayIndex, getWeekIndex, strDateToIndex } from "../utils";
import { GroupDay, TeacherDay } from "./parser/types";

export type ArchiveAppendDay = {
    type: 'group',
    group: string,
    day: GroupDay
} | {
    type: 'teacher',
    teacher: string,
    day: TeacherDay
}

function dbEntryToDayObject(entry: any): any {
    return {
        day: formatDate(dayIndexToDate(entry.day)),
        lessons: JSON.parse(entry.data)
    };
}

export class Archive {
    private _dayIndexBounds: { min: number, max: number } | undefined;
    private _groups: string[] | undefined;
    private _teachers: string[] | undefined;

    public cleanCache() {
        this._dayIndexBounds = undefined;
        this._groups = undefined;
        this._teachers = undefined;
    }

    public getDayIndexBounds(): { min: number, max: number } {
        if (!this._dayIndexBounds) {
            this._dayIndexBounds = db.prepare('SELECT MIN(`day`) as `min`, MAX(`day`) as `max` FROM timetable_archive').get() as any;
        }

        return this._dayIndexBounds!;
    }

    public getWeekIndexBounds(): { min: number, max: number } {
        const { min, max } = this.getDayIndexBounds();

        return {
            min: getWeekIndex(dayIndexToDate(min)),
            max: getWeekIndex(dayIndexToDate(max))
        }
    }

    public getGroups() {
        if (!this._groups) {
            this._groups = (db.prepare('SELECT DISTINCT `group` FROM timetable_archive WHERE `group` IS NOT NULL').all() as any).map((entry: any) => {
                return entry.group;
            });
        }

        return this._groups!;
    }

    public getTeachers() {
        if (!this._teachers) {
            this._teachers = (db.prepare('SELECT DISTINCT `teacher` FROM timetable_archive WHERE `teacher` IS NOT NULL').all() as any).map((entry: any) => {
                return entry.teacher;
            });
        }

        return this._teachers!;
    }

    public addGroupDay(group: number | string, day: GroupDay): void {
        this._dayIndexBounds = undefined;
        this._groups = undefined;

        const dayIndex: number = strDateToIndex(day.day);
        const data = JSON.stringify(day.lessons);

        db.prepare('INSERT INTO timetable_archive (day, `group`, data) VALUES (?, ?, ?) ON CONFLICT(day, `group`) DO UPDATE SET data = ?')
            .run(dayIndex, group, data, data);
    }

    public addTeacherDay(teacher: string, day: TeacherDay): void {
        this._dayIndexBounds = undefined;
        this._teachers = undefined;

        const dayIndex: number = strDateToIndex(day.day);
        const data = JSON.stringify(day.lessons);

        db.prepare('INSERT INTO timetable_archive (day, teacher, data) VALUES (?, ?, ?) ON CONFLICT(day, teacher) DO UPDATE SET data = ?')
            .run(dayIndex, teacher, data, data);
    }

    public getGroupDay(dayIndex: number, group: number | string): GroupDay | null {
        const entry = db.prepare('SELECT day,data FROM timetable_archive WHERE day = ? AND `group` = ?').get(dayIndex, group) as any;
        return entry ? dbEntryToDayObject(entry) : null;
    }

    public getTeacherDay(dayIndex: number, teacher: string): TeacherDay | null {
        const entry = db.prepare('SELECT day,data FROM timetable_archive WHERE day = ? AND teacher = ?').get(dayIndex, teacher) as any;
        return entry ? dbEntryToDayObject(entry) : null;
    }

    public getGroupDaysByBounds(dayBounds: [number, number], group: number | string): GroupDay[] {
        const days = db.prepare('SELECT day,data FROM timetable_archive WHERE day >= ? AND day <= ? AND `group` = ?').all(...dayBounds, group) as any;

        return days.map(dbEntryToDayObject);
    }

    public getTeacherDaysByBounds(dayBounds: [number, number], teacher: string): TeacherDay[] {
        const days = db.prepare('SELECT day,data FROM timetable_archive WHERE day >= ? AND day <= ? AND teacher = ?').all(...dayBounds, teacher) as any;

        return days.map(dbEntryToDayObject);
    }

    public * iterateGroupDays(group: number | string) {
        const entries = db.prepare('SELECT day, data FROM timetable_archive WHERE `group` = ?')
            .iterate(group) as IterableIterator<any>;

        for (const entry of entries) {
            const day: GroupDay = dbEntryToDayObject(entry)

            yield day;
        }
    }

    public * iterateTeacherDays(teacher: string) {
        const entries = db.prepare('SELECT day,data FROM timetable_archive WHERE teacher = ?')
            .iterate(teacher) as IterableIterator<any>;

        for (const entry of entries) {
            const day: TeacherDay = dbEntryToDayObject(entry)

            yield day;
        }
    }

    public appendDays(entries: ArchiveAppendDay[]) {
        for (const entry of entries) {
            // const dayIndex: number = strDateToIndex(entry.day.day);
            // const data = JSON.stringify(entry.day.lessons);

            if (entry.type === 'group') {
                this.addGroupDay(entry.group, entry.day);
            } else if (entry.type === 'teacher') {
                this.addTeacherDay(entry.teacher, entry.day);
            }
        }
    }
}