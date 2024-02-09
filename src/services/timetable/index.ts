import { AppService } from "../../app";
import db from "../../db";
import { DayIndex, StringDate, WeekIndex, addslashes } from "../../utils";
import { loadCache } from "../parser/raspCache";
import { GroupDay, TeacherDay } from "./types";

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
        day: StringDate.fromDayIndex(entry.day).toString(),
        lessons: JSON.parse(entry.data)
    };
}

export class Timetable implements AppService {
    private _dayIndexBounds: { min: number, max: number } | undefined;
    private _groups: string[] | undefined;
    private _teachers: string[] | undefined;

    constructor() {

    }

    public register(): boolean {
        return true;
    }

    public run() {
        loadCache();
    }

    public resetCache() {
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
            min: WeekIndex.fromDayIndex(min).valueOf(),
            max: WeekIndex.fromDayIndex(max).valueOf()
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

        const dayIndex: number = DayIndex.fromStringDate(day.day).valueOf();
        const data = JSON.stringify(day.lessons);

        db.prepare('INSERT INTO timetable_archive (day, `group`, data) VALUES (?, ?, ?) ON CONFLICT(day, `group`) DO UPDATE SET data = ?')
            .run(dayIndex, group, data, data);
    }

    public addTeacherDay(teacher: string, day: TeacherDay): void {
        this._dayIndexBounds = undefined;
        this._teachers = undefined;

        const dayIndex: number = DayIndex.fromStringDate(day.day).valueOf();
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

    public getGroupDaysByRange(dayBounds: [number, number], group: number | string): GroupDay[] {
        const days = db.prepare('SELECT day,data FROM timetable_archive WHERE day >= ? AND day <= ? AND `group` = ?').all(...dayBounds, group) as any;

        return days.map(dbEntryToDayObject);
    }

    public getTeacherDaysByRange(dayBounds: [number, number], teacher: string): TeacherDay[] {
        const days = db.prepare('SELECT day,data FROM timetable_archive WHERE day >= ? AND day <= ? AND teacher = ?').all(...dayBounds, teacher) as any;

        return days.map(dbEntryToDayObject);
    }

    public getGroupDays(group: number | string, fromDay?: number): GroupDay[] {
        const days = db.prepare(
            'SELECT day, data FROM timetable_archive WHERE `group` = ?' +
            (fromDay ? ` AND day >= ${addslashes(fromDay)}` : '')
        ).all(group) as any;

        return days.map(dbEntryToDayObject);
    }

    public getTeacherDays(teacher: string, fromDay?: number): TeacherDay[] {
        const days = db.prepare(
            'SELECT day, data FROM timetable_archive WHERE teacher = ?' +
            (fromDay ? ` AND day >= ${addslashes(fromDay)}` : '')
        ).all(teacher) as any;

        return days.map(dbEntryToDayObject);
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

export * from './types';

