import { Op } from "sequelize";
import { config } from "../../../config";
import { App } from "../../app";
import { Logger } from "../../logger";
import { DayIndex, KeyedQueue, StringDate, WeekIndex } from "../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../parser";
import { GroupDay, GroupLessonExplain, TeacherDay, TeacherLessonExplain } from "../parser/types";
import { ArchiveAppendDay } from "../timetable";
import { CalendarItem, CalendarLessonInfo, CalendarType } from "./models/calendar";

interface SyncOptions {
    forceFullResync: boolean,
    firstlyRelevant: boolean
}

export class GoogleCalendarController {
    public logger: Logger = new Logger('GoogleCalendar');

    private app: App;
    private queue: KeyedQueue = new KeyedQueue();

    constructor(app: App) {
        this.app = app;
    }

    public run() {
        const { events } = this.app.getService('parser');

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
                }
            }
        });

        const promises: Promise<any>[] = [];

        for (const calendar of calendarsToSync) {
            promises.push(this.resync(calendar));
        }

        await Promise.all(promises);

        this.logger.log('Все календари синхронизированы');
    }

    private getTimetable() {
        return this.app.getService('timetable');
    }

    private async groupDay(calendar: CalendarItem, { group, day }: GroupDayEvent) {
        const logger = this.logger.extend(`group:${group}`);

        logger.debug(`Sync ${day.day}`, calendar.calendarId);

        await calendar.clearDay(day, (event) => {
            logger.debug(`EventDeleted`, event.summary, event.id);
        });

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

        await calendar.clearDay(day, (event) => {
            logger.debug(`EventDeleted`, event.summary, event.id);
        });

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
        const records = days.slice().sort((_a, _b) => {
            const a = DayIndex.fromStringDate(_a.day.day).valueOf();
            const b = DayIndex.fromStringDate(_b.day.day).valueOf();

            return a - b;
        }).reduce<Record<CalendarType, { [key: string]: ArchiveAppendDay[] }>>((acc, appendDay) => {
            const type: CalendarType = appendDay.type;
            const value: string = appendDay.value;

            if (!acc[type][value]) {
                acc[type][value] = [];
            }

            acc[type][value].push(appendDay);

            return acc;
        }, {
            group: {},
            teacher: {}
        });

        const calendars = await this.queue.execute('onFlushCache:getCalendars', () => {
            return Promise.all([
                CalendarItem.findAll({
                    where: {
                        type: 'group',
                        value: {
                            [Op.in]: Object.keys(records.group)
                        }
                    }
                }),
                CalendarItem.findAll({
                    where: {
                        type: 'teacher',
                        value: {
                            [Op.in]: Object.keys(records.teacher)
                        }
                    }
                })
            ]);
        }).then(([groups, teachers]) => {
            const reducer = (entries: any, calendar: CalendarItem) => {
                entries[calendar.value] = calendar;

                return entries;
            }

            return {
                group: groups.reduce<Record<string, CalendarItem>>(reducer, {}),
                teacher: teachers.reduce<Record<string, CalendarItem>>(reducer, {}),
            }
        });

        const promises: Promise<void>[] = [];

        for (const [type, grouped] of Object.entries(records)) {
            for (const [value, days] of Object.entries(grouped)) {
                const calendar = calendars[type as CalendarType][value];
                if (!calendar) {
                    continue;
                }

                const promise = this.queue.execute(calendar.calendarId, async () => {
                    for (const appendDay of days) {
                        const dayIndex = DayIndex.fromStringDate(appendDay.day.day).valueOf();

                        switch (appendDay.type) {
                            case 'group':
                                await this.groupDay(calendar, {
                                    group: appendDay.value,
                                    day: appendDay.day
                                });

                                break;
                            case 'teacher':
                                await this.teacherDay(calendar, {
                                    teacher: appendDay.value,
                                    day: appendDay.day
                                });

                                break;
                        }

                        await calendar.update({ lastManualSyncedDay: dayIndex });
                    }

                    await calendar.update({ lastManualSyncedDay: null });
                });

                promise.catch(console.error);

                promises.push(promise);
            }
        }

        await Promise.all(promises);
    }

    public async resync(calendar: CalendarItem, { forceFullResync, firstlyRelevant }: Partial<SyncOptions> = {}) {
        const logger = this.logger.extend(`${calendar.type}:${calendar.value}`);

        let fromDay: number | undefined;
        if (!forceFullResync && calendar.lastManualSyncedDay !== null) {
            fromDay = calendar.lastManualSyncedDay;

            if (fromDay) {
                fromDay += 1;
            }
        }

        return this.queue.execute(calendar.calendarId, async () => {
            logger.debug('Start sync', calendar.calendarId);

            let days: GroupDay[] | TeacherDay[];
            switch (calendar.type) {
                case 'group':
                    days = await this.getTimetable().getGroupDays(calendar.value, fromDay);
                    break;
                case 'teacher':
                    days = await this.getTimetable().getTeacherDays(calendar.value, fromDay);
                    break;
            }

            let weekStartingDayIndex: number | undefined;
            if (firstlyRelevant) {
                weekStartingDayIndex = WeekIndex.getRelevant().getWeekDayIndexRange()[0];

                const currentDays: any = days.filter(({ day }) => {
                    const dayIndex = DayIndex.fromStringDate(day).valueOf();

                    return dayIndex >= weekStartingDayIndex!;
                });

                const anotherDays: any = days.filter(({ day }) => {
                    const dayIndex = DayIndex.fromStringDate(day).valueOf();

                    return dayIndex < weekStartingDayIndex!;
                });

                days = [...currentDays, ...anotherDays];
            }

            let useUpdate: boolean = !weekStartingDayIndex;

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

                if (weekStartingDayIndex && dayIndex < weekStartingDayIndex) {
                    useUpdate = true;
                }

                if (useUpdate) {
                    await calendar.update({ lastManualSyncedDay: dayIndex });
                }
            }

            await calendar.update({ lastManualSyncedDay: null });

            logger.debug('Calendar fully synced', calendar.calendarId);
        });
    }

    public async resyncAll(forceFullResync?: boolean) {
        const promises: Promise<any>[] = [];

        const [groups, teachers] = await Promise.all([
            this.getTimetable().getGroups(),
            this.getTimetable().getTeachers()
        ]);

        const entries: {
            type: CalendarType,
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
            let calendar: CalendarItem | null;

            try {
                calendar = await CalendarItem.getCalendar(type, value);
                if (!calendar) {
                    continue;
                }
            } catch (e) {
                console.error(e);
                break;
            }

            promises.push(this.resync(calendar, { forceFullResync }));
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
            line.push(`<b>Группа:</b> ${lesson.subgroup ? `${lesson.subgroup}. ` : ''}${lesson.group}`);
        }

        line.push(`<b>Кабинет:</b> ${lesson.cabinet || '-'}`);

        if (lesson.comment) {
            line.push(`<b>Примечание:</b> ${lesson.comment}`);
        }

        return {
            title: `${lesson.subgroup ? `${lesson.subgroup}. ` : ''}${lesson.group}-${lesson.lesson}`,
            description: line.join('\n'),
            location: lesson.cabinet || undefined
        }
    }
}