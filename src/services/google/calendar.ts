import { config } from "../../../config";
import { App } from "../../app";
import { DayIndex, StringDate } from "../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../parser";
import { ServiceStorage } from "../storage";
import { GroupDay, GroupLessonExplain, TeacherDay, TeacherLessonExplain } from "../timetable/types";
import { GoogleServiceApi } from "./api";
import { GoogleCalendarApi } from "./api/calendar";

export class GoogleCalendar {
    public api: GoogleCalendarApi;
    private cache: ServiceStorage;
    private app: App;

    constructor(app: App) {
        this.app = app;
        this.cache = new ServiceStorage('google_calendar');
        this.api = new GoogleServiceApi().calendar;
    }

    public run() {
        const updater = this.app.getService('parser');

        updater.events.on('addGroupDay', this.groupDay.bind(this));
        updater.events.on('updateGroupDay', this.groupDay.bind(this));

        updater.events.on('addTeacherDay', this.teacherDay.bind(this));
        updater.events.on('updateTeacherDay', this.teacherDay.bind(this));
    }

    private getTimetable() {
        return this.app.getService('timetable');
    }

    public async groupDay({ group, day }: GroupDayEvent) {
        const calendarId = await this.getCalendarId('group', group);

        if (config.dev) {
            console.log(`[GoogleCalendar:group:${group}]`, `Sync ${day.day}`, calendarId);
        }

        await this.clearDay(calendarId, day);

        const promises: Promise<any>[] = [];

        for (const i in day.lessons) {
            const lesson = day.lessons[i];
            if (!lesson) continue;

            const lessons = Array.isArray(lesson) ? lesson : [lesson];
            const { title, description, location } = this.getGroupLessonInfo(lessons);
            const [from, to] = this.getLessonTimeBounds(day, +i);

            const response = this.api.createEvent({
                calendarId: calendarId,
                title: title,
                start: from,
                end: to,
                description: description,
                location: location
            });

            promises.push(response);

            if (config.dev) {
                response.then((response) => {
                    console.log(`[GoogleCalendar:group:${group}]`, `EventCreated`, +i + 1, title, response.id)
                })
            }
        }

        await Promise.all(promises);
    }

    public async teacherDay({ teacher, day }: TeacherDayEvent) {
        const calendarId = await this.getCalendarId('teacher', teacher);

        if (config.dev) {
            console.log(`[GoogleCalendar:teacher:${teacher}]`, `Sync ${day.day}`, calendarId);
        }

        await this.clearDay(calendarId, day);

        const promises: Promise<any>[] = [];

        for (const i in day.lessons) {
            const lesson = day.lessons[i];
            if (!lesson) continue;

            const { title, description, location } = this.getTeacherLessonInfo(lesson);
            const [from, to] = this.getLessonTimeBounds(day, +i);

            const response = this.api.createEvent({
                calendarId: calendarId,
                title: title,
                start: from,
                end: to,
                description: description,
                location: location
            });

            promises.push(response);

            if (config.dev) {
                response.then((response) => {
                    console.log(`[GoogleCalendar:teacher:${teacher}]`, `EventCreated`, +i + 1, title, response.id)
                })
            }
        }

        await Promise.all(promises);
    }

    public async resyncGroup(group: string, forceFullResync: boolean = false) {
        let fromDay: number | undefined;
        if (!forceFullResync) {
            fromDay = this.cache.getMeta(`group_${group}`, 'lastSyncedDay');

            if (fromDay) {
                fromDay += 1;
            }
        }

        const days = this.getTimetable().getGroupDays(group, fromDay);

        for (const day of days) {
            await this.groupDay({ group, day });

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
            this.cache.setMeta(`group_${group}`, 'lastSyncedDay', dayIndex);
        }
    }

    public async resyncTeacher(teacher: string, forceFullResync: boolean = false) {
        let fromDay: number | undefined;
        if (!forceFullResync) {
            fromDay = this.cache.getMeta(`teacher_${teacher}`, 'lastSyncedDay');

            if (fromDay) {
                fromDay += 1;
            }
        }

        const days = this.getTimetable().getTeacherDays(teacher, fromDay);

        for (const day of days) {
            await this.teacherDay({ teacher, day });

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
            this.cache.setMeta(`teacher_${teacher}`, 'lastSyncedDay', dayIndex);
        }
    }

    public async resync() {
        const promises: Promise<any>[] = [];

        const entries: {
            type: 'group' | 'teacher',
            value: string
        }[] = [
                ...this.getTimetable().getGroups().map((value): { type: 'group', value: string } => {
                    return { type: 'group', value }
                }),
                ...this.getTimetable().getTeachers().map((value): { type: 'teacher', value: string } => {
                    return { type: 'teacher', value }
                })
            ];

        for (const { type, value } of entries) {
            try {
                await this.getCalendarId(type, value);
            } catch (e) {
                console.error(e);
                break;
            }

            if (type === 'group') {
                promises.push(this.resyncGroup(value));
            }

            if (type === 'teacher') {
                promises.push(this.resyncTeacher(value));
            }
        }

        await Promise.all(promises);
    }

    private async clearDay(calendarId: string, { day }: GroupDay | TeacherDay) {
        const dayDate = StringDate.fromStringDate(day).toDate();
        await this.api.clearDayEvents(calendarId, dayDate);
    }

    private async getCalendarId(type: 'teacher' | 'group', value: string | number): Promise<string> {
        const key = `${type}_${value}`;

        let cacheId: string | null = this.cache.get(key);
        if (cacheId) {
            return cacheId;
        }

        let owner: string | undefined;
        if (type === 'group') {
            owner = 'Группа';
        } else if (type === 'teacher') {
            owner = 'Преподаватель';
        }

        console.log('Creating calendar:', key);
        const id = await this.api.createCalendar(`Расписание занятий (${owner} - ${value})`);
        console.log('Created', key, id);

        this.cache.add(key, id);

        return id;
    }

    private getLessonTimeBounds({ day }: GroupDay | TeacherDay, lessonIndex: number) {
        let dayCall = config.timetable.weekdays[lessonIndex];
        if (!dayCall) {
            dayCall = config.timetable.weekdays.at(-1)!;
        }

        return [
            StringDate.fromStringDateTime(day, dayCall[0][0]).toDate(),
            StringDate.fromStringDateTime(day, dayCall[1][1]).toDate()
        ]
    }

    private getGroupLessonInfo(lessons: GroupLessonExplain[]) {
        const title = lessons.map((lesson) => {
            const line: string[] = [];

            if (lesson.subgroup) {
                line.push(`${lesson.subgroup}.`);
            }

            line.push(lesson.lesson);

            return line.join(' ');
        }).join(' | ');

        const description = lessons.map((lesson) => {
            const line: string[] = [];

            if (lesson.subgroup) {
                line.push(`<i>${lesson.subgroup}-я подгруппа:</i>`);
            }

            line.push(`<b>Предмет:</b> ${lesson.lesson}`);

            if (lesson.type) {
                line.push(`<b>Вид:</b> ${lesson.type}`);
            }

            if (lesson.teacher) {
                line.push(`<b>Преподаватель:</b> ${lesson.teacher}`);
            }

            line.push(`<b>Кабинет:</b> ${lesson.cabinet || '-'}`);

            if (lesson.comment) {
                line.push(`<b>Примечание:</b> ${lesson.comment}`);
            }

            return line.join('\n');
        }).join('\n\n');

        let location: string | undefined;
        if (lessons.length > 0 && !lessons.every((_) => { return _.cabinet === null })) {
            location = lessons.map((lesson) => {
                return lesson.cabinet || '-';
            }).join(' | ');
        }

        return {
            title, description, location
        }
    }

    private getTeacherLessonInfo(lesson: TeacherLessonExplain) {
        const title = `${lesson.group}-${lesson.lesson}`;


        const line: string[] = [];
        line.push(`<b>Предмет:</b> ${lesson.lesson}`);
        if (lesson.type) {
            line.push(`<b>Вид:</b> ${lesson.type}`);
        }

        if (lesson.group) {
            line.push(`<b>Группа:</b> ${lesson.group}`);
        }

        line.push(`<b>Кабинет:</b> ${lesson.cabinet || '-'}`);

        if (lesson.comment) {
            line.push(`<b>Примечание:</b> ${lesson.comment}`);
        }

        const description = line.join('\n');


        const location: string | undefined = lesson.cabinet || undefined;

        return {
            title, description, location
        }
    }
}