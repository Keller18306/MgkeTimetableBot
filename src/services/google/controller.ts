import { Op } from "sequelize";
import { config } from "../../../config";
import { App } from "../../app";
import { DayIndex, StringDate } from "../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../parser";
import { GroupDay, GroupLessonExplain, TeacherDay, TeacherLessonExplain } from "../parser/types";
import { ArchiveAppendDay } from "../timetable";
import { CalendarItem, CalendarLessonInfo } from "./models/calendar";
import { Logger } from "../../logger";

export class GoogleCalendarController {
    public logger: Logger = new Logger('GoogleCalendar');

    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    public run() {
        const { events } = this.app.getService('parser');

        events.on('addGroupDay', this.onGroupDay.bind(this));
        events.on('updateGroupDay', this.onGroupDay.bind(this));

        events.on('addTeacherDay', this.onTeacherDay.bind(this));
        events.on('updateTeacherDay', this.onTeacherDay.bind(this));

        events.on('flushCache', this.onFlushCache.bind(this));

        this.resumeSync().catch((err) => {
            this.logger.error('Sync error', err)
        });
    }

    public async resumeSync() {
        const calendarsToSync = await CalendarItem.findAll({
            where: {
                lastManualSyncedDay: {
                    [Op.not]: null
                } as any
            }
        });

        const promises: Promise<any>[] = [];

        for (const calendar of calendarsToSync) {
            promises.push(this.resyncCalendar(calendar));
        }

        await Promise.all(promises);

        this.logger.log('Все календари синхронизированы');
    }

    private getTimetable() {
        return this.app.getService('timetable');
    }

    private async onGroupDay(event: GroupDayEvent) {
        const calendar = await CalendarItem.getCalendar('group', event.group);
        if (!calendar) {
            return;
        }

        await this.groupDay(calendar, event);
    }

    public async onTeacherDay(event: TeacherDayEvent) {
        const calendar = await CalendarItem.getCalendar('teacher', event.teacher);
        if (!calendar) {
            return;
        }

        await this.teacherDay(calendar, event);
    }

    private async groupDay(calendar: CalendarItem, { group, day }: GroupDayEvent) {
        const logger = this.logger.extend(`group:${group}`);

        logger.debug(`Sync ${day.day}`, calendar.calendarId);

        try {
            await calendar.clearDay(day);
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
                const response = calendar.createEvent(lessonInfo, day, bound).then(response => {
                    logger.debug(`EventCreated`, +i + 1, lessonInfo.title, response.id);

                    return response;
                });

                promises.push(response);
            }
        }

        await Promise.all(promises);
    }

    public async teacherDay(calendar: CalendarItem, { teacher, day }: TeacherDayEvent) {
        const logger = this.logger.extend(`teacher:${teacher}`);

        logger.debug(`Sync ${day.day}`, calendar.calendarId);

        try {
            calendar.clearDay(day);
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
                const response = calendar.createEvent(lessonInfo, day, bound).then(response => {
                    logger.debug(`EventCreated`, +i + 1, lessonInfo.title, response.id);

                    return response;
                });

                promises.push(response);
            }
        }

        await Promise.all(promises);
    }

    private async onFlushCache(days: ArchiveAppendDay[]) {
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

                    let calendar: CalendarItem | null;
                    switch (appendDay.type) {
                        case 'group':
                            calendar = await CalendarItem.getCalendar('group', appendDay.group);
                            if (calendar) {
                                await this.groupDay(calendar, appendDay);
                            }
                            break;
                        case 'teacher':
                            calendar = await CalendarItem.getCalendar('teacher', appendDay.teacher);
                            if (calendar) {
                                await this.teacherDay(calendar, appendDay);
                            }
                            break;
                    }

                    if (calendar) {
                        await calendar.update({ lastManualSyncedDay: dayIndex });
                    }
                }
            })();

            promise.catch(console.error);

            promises.push(promise);
        }

        await Promise.all(promises)
    }

    public async resyncCalendar(calendar: CalendarItem, forceFullResync: boolean = false) {
        let fromDay: number | undefined;
        if (!forceFullResync) {
            fromDay = calendar.lastManualSyncedDay;

            if (fromDay) {
                fromDay += 1;
            }
        }

        let days: GroupDay[] | TeacherDay[];
        switch (calendar.type) {
            case 'group':
                days = await this.getTimetable().getGroupDays(calendar.value, fromDay);
                break;
            case 'teacher':
                days = await this.getTimetable().getTeacherDays(calendar.value, fromDay);
                break;
        }

        for (const day of days) {
            switch (calendar.type) {
                case 'group':
                    await this.groupDay(calendar, {
                        group: calendar.value,
                        day: day as GroupDay
                    });
                    break;
                case 'teacher':
                    await this.teacherDay(calendar, {
                        teacher: calendar.value,
                        day: day as TeacherDay
                    });
                    break;
            }

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();

            await calendar.update({ lastManualSyncedDay: dayIndex });
        }
    }

    public async resync(forceFullResync?: boolean) {
        const promises: Promise<any>[] = [];

        const [groups, teachers] = await Promise.all([
            this.getTimetable().getGroups(),
            this.getTimetable().getTeachers()
        ]);

        const entries: {
            type: 'group' | 'teacher',
            value: string
        }[] = [
                ...groups.map((value): { type: 'group', value: string } => {
                    return { type: 'group', value }
                }),
                ...teachers.map((value): { type: 'teacher', value: string } => {
                    return { type: 'teacher', value }
                })
            ];

        for (const { type, value } of entries) {
            let calendar: CalendarItem;
            try {
                calendar = await CalendarItem.getOrCreateCalendar(type, value);
            } catch (e) {
                console.error(e);
                break;
            }

            promises.push(this.resyncCalendar(calendar, forceFullResync));
        }

        await Promise.all(promises);
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

    private getGroupLessonInfo(lessons: GroupLessonExplain[]): CalendarLessonInfo {
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

    private getTeacherLessonInfo(lesson: TeacherLessonExplain): CalendarLessonInfo {
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
}