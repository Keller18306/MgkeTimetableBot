import db from "../db";
import { dayIndexToDate, formatDate, strDateToIndex } from "../utils";
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
    public addGroupDay(group: number | string, day: GroupDay): void {
        const dayIndex: number = strDateToIndex(day.day);
        const data = JSON.stringify(day.lessons);

        db.prepare('INSERT INTO timetable_archive (day, `group`, data) VALUES (?, ?, ?) ON CONFLICT(day, `group`) DO UPDATE SET data = ?')
            .run(dayIndex, group, data, data);
    }

    public addTeacherDay(teacher: string, day: TeacherDay): void {
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

    public getTeacherDayByBounds(dayBounds: [number, number], teacher: string): TeacherDay[] {
        const days = db.prepare('SELECT day,data FROM timetable_archive WHERE day >= ? AND day <= ? AND teacher = ?').all(...dayBounds, teacher) as any;

        return days.map(dbEntryToDayObject);
    }

    public getDayIndexBounds(): { min: number, max: number } {
        return (db.prepare('SELECT MIN(`day`) as `min`, MAX(`day`) as `max` FROM timetable_archive').get() as any);
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