import { GaxiosError } from "gaxios";
import { config } from "../../../config";
import { App } from "../../app";
import { DayIndex, StringDate } from "../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../parser";
import { ArchiveAppendDay } from "../timetable";
import { GroupDay, GroupLessonExplain, TeacherDay, TeacherLessonExplain } from "../timetable/types";
import { GoogleCalendarApi, GoogleServiceApi } from "./api";
import { CalendarStorage } from "./storage";

interface LessonInfo {
    title: string;
    description: string;
    location: string | undefined;
}

export class GoogleCalendar {
    public api: GoogleCalendarApi;
    public storage: CalendarStorage;
    private app: App;

    constructor(app: App) {
        this.app = app;
        this.storage = new CalendarStorage();
        this.api = new GoogleServiceApi().calendar;
    }

    public run() {
        const { events } = this.app.getService('parser');

        events.on('addGroupDay', this.groupDay.bind(this));
        events.on('updateGroupDay', this.groupDay.bind(this));

        events.on('addTeacherDay', this.teacherDay.bind(this));
        events.on('updateTeacherDay', this.teacherDay.bind(this));

        events.on('flushCache', this.flushCache.bind(this))
    }

    private getTimetable() {
        return this.app.getService('timetable');
    }

    public async groupDay({ group, day }: GroupDayEvent) {
        const calendarId = await this.getCalendarId('group', group);

        if (config.dev) {
            console.log(`[GoogleCalendar:group:${group}]`, `Sync ${day.day}`, calendarId);
        }

        try {
            await this.clearDay(calendarId, day);
        } catch (e) {
            console.error(e);
            return;
        }

        const promises: Promise<any>[] = [];

        for (const i in day.lessons) {
            const lesson = day.lessons[i];
            if (!lesson) continue;

            const lessons = Array.isArray(lesson) ? lesson : [lesson];
            const lessonInfo = this.getGroupLessonInfo(lessons);
            const bounds = this.getLessonTimeBounds(+i, day);

            for (const bound of bounds) {
                const response = this.createEvent(calendarId, lessonInfo, day, bound).then(response => {
                    if (config.dev) {
                        console.log(`[GoogleCalendar:group:${group}]`, `EventCreated`, +i + 1, lessonInfo.title, response.id);
                    }

                    return response;
                });

                promises.push(response);
            }
        }

        await Promise.all(promises);
    }

    public async teacherDay({ teacher, day }: TeacherDayEvent) {
        const calendarId = await this.getCalendarId('teacher', teacher);

        if (config.dev) {
            console.log(`[GoogleCalendar:teacher:${teacher}]`, `Sync ${day.day}`, calendarId);
        }

        try {
            await this.clearDay(calendarId, day);
        } catch (e) {
            console.error(e);
            return;
        }

        const promises: Promise<any>[] = [];

        for (const i in day.lessons) {
            const lesson = day.lessons[i];
            if (!lesson) continue;

            const lessonInfo = this.getTeacherLessonInfo(lesson);
            const bounds = this.getLessonTimeBounds(+i, day);

            for (const bound of bounds) {
                const response = this.createEvent(calendarId, lessonInfo, day, bound).then(response => {
                    if (config.dev) {
                        console.log(`[GoogleCalendar:teacher:${teacher}]`, `EventCreated`, +i + 1, lessonInfo.title, response.id);
                    }

                    return response;
                });

                promises.push(response);
            }
        }

        await Promise.all(promises);
    }

    public async flushCache(days: ArchiveAppendDay[]) {
        const ordered = days.slice().sort((_a, _b) => {
            const a = DayIndex.fromStringDate(_a.day.day).valueOf();
            const b = DayIndex.fromStringDate(_b.day.day).valueOf();

            return a - b;
        }).reduce<{ [key: string]: ArchiveAppendDay[] }>((acc, appendDay) => {
            let value: string;

            switch (appendDay.type) {
                case 'group':
                    value = appendDay.group;
                    break;
                case 'teacher':
                    value = appendDay.teacher;
                    break;
            }

            if (!acc[`${appendDay.type}_${value}`]) {
                acc[`${appendDay.type}_${value}`] = [];
            }

            acc[`${appendDay.type}_${value}`].push(appendDay);

            return acc;
        }, {});

        const promises: Promise<void>[] = [];

        for (const key in ordered) {
            const days = ordered[key];

            const promise = (async () => {
                for (const appendDay of days) {
                    const dayIndex = DayIndex.fromStringDate(appendDay.day.day).valueOf();

                    let value: string;
                    switch (appendDay.type) {
                        case 'group':
                            await this.groupDay(appendDay);
                            value = appendDay.group;
                            break;
                        case 'teacher':
                            await this.teacherDay(appendDay);
                            value = appendDay.teacher;
                            break;
                    }

                    this.storage.setLastManualSyncedDay(appendDay.type, value, dayIndex)
                }
            })();

            promise.catch(console.error);

            promises.push(promise);
        }

        await Promise.all(promises)
    }

    public async resyncGroup(group: string, forceFullResync: boolean = false) {
        let fromDay: number | undefined;
        if (!forceFullResync) {
            fromDay = this.storage.getLastManualSyncedDay('group', group);

            if (fromDay) {
                fromDay += 1;
            }
        }

        const days = this.getTimetable().getGroupDays(group, fromDay);

        for (const day of days) {
            await this.groupDay({ group, day });

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
            this.storage.setLastManualSyncedDay('group', group, dayIndex)
        }
    }

    public async resyncTeacher(teacher: string, forceFullResync: boolean = false) {
        let fromDay: number | undefined;
        if (!forceFullResync) {
            fromDay = this.storage.getLastManualSyncedDay('teacher', teacher);

            if (fromDay) {
                fromDay += 1;
            }
        }

        const days = this.getTimetable().getTeacherDays(teacher, fromDay);

        for (const day of days) {
            await this.teacherDay({ teacher, day });

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
            this.storage.setLastManualSyncedDay('teacher', teacher, dayIndex);
        }
    }

    public async resync(forceFullResync?: boolean) {
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
                promises.push(this.resyncGroup(value, forceFullResync));
            }

            if (type === 'teacher') {
                promises.push(this.resyncTeacher(value, forceFullResync));
            }
        }

        await Promise.all(promises);
    }

    private async clearDay(calendarId: string, { day }: GroupDay | TeacherDay) {
        const dayDate = StringDate.fromStringDate(day).toDate();
        try {
            await this.api.clearDayEvents(calendarId, dayDate);
        } catch (e) {
            if (e instanceof GaxiosError) {
                if (e.status === 410) {
                    this.storage.deleteCalendarId(calendarId);
                }
            }

            throw e;
        }
    }

    private async getCalendarId(type: 'teacher' | 'group', value: string | number): Promise<string> {
        let cachedCalendarId: string | undefined;
        if (cachedCalendarId = this.storage.getCalendarId(type, value)) {
            return cachedCalendarId;
        }

        let owner: string | undefined;
        if (type === 'group') {
            owner = 'Группа';
        } else if (type === 'teacher') {
            owner = 'Преподаватель';
        }

        console.log('Creating calendar:', type, value);
        const calendarId = await this.api.createCalendar(`Расписание занятий (${owner} - ${value})`);
        console.log('Created', type, value, calendarId);

        this.storage.saveCalendarId(type, value, calendarId);

        return calendarId;
    }

    private getLessonTimeBounds(lessonIndex: number, { day }: TeacherDay | GroupDay) {
        const isSaturday: boolean = StringDate.fromStringDate(day).isSaturday();
        const calls = config.timetable[isSaturday ? 'saturday' : 'weekdays'];

        let dayCall = calls[lessonIndex];
        if (!dayCall) {
            dayCall = calls.at(-1)!;
        }

        return dayCall;
    }

    private getGroupLessonInfo(lessons: GroupLessonExplain[]): LessonInfo {
        const everyTitleEqual = lessons.every(
            lesson => lesson.lesson === lessons[0].lesson
        );

        let title: string;
        if (everyTitleEqual && lessons.length > 1) {
            title = lessons.map((lesson) => {
                return lesson.subgroup;
            }).join(',') + ' - ' + lessons[0].lesson;
        } else {
            title = lessons.map((lesson) => {
                const line: string[] = [];

                if (lesson.subgroup) {
                    line.push(`${lesson.subgroup}.`);
                }

                line.push(lesson.lesson);

                return line.join(' ');
            }).join(' | ');
        }
  
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

    private getTeacherLessonInfo(lesson: TeacherLessonExplain): LessonInfo {
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

        return {
            title: `${lesson.group}-${lesson.lesson}`,
            description: line.join('\n'),
            location: lesson.cabinet || undefined
        }
    }

    private createEvent(calendarId: string, { title, description, location }: LessonInfo, { day }: GroupDay | TeacherDay, bound: [string, string]) {
        const from = StringDate.fromStringDateTime(day, bound[0]).toDate();
        const to = StringDate.fromStringDateTime(day, bound[1]).toDate();

        return this.api.createEvent({
            calendarId: calendarId,
            title: title,
            start: from,
            end: to,
            description: description,
            location: location
        });
    }
}