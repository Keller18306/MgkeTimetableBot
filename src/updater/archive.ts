import db from "../db";
import { strDateToIndex } from "../utils";
import { GroupDay, GroupLesson, TeacherDay, TeacherLesson } from "./parser/types";

export type ArchiveAppendDay = {
    type: 'group',
    group: string,
    day: GroupDay
} | {
    type: 'teacher',
    teacher: string,
    day: TeacherDay
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

    public getGroupDay(dayIndex: number, group: number | string): GroupLesson[] {
        const entry = db.prepare('SELECT * FROM timetable_archive WHERE day = ? AND `group` = ?').get(dayIndex, group) as any;
        return entry ? JSON.parse(entry.data) : null;
    }

    public getTeacherDay(dayIndex: number, teacher: string): TeacherLesson[] {
        const entry = db.prepare('SELECT * FROM timetable_archive WHERE day = ? AND teacher = ?').get(dayIndex, teacher) as any;
        return entry ? JSON.parse(entry.data) : null;
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