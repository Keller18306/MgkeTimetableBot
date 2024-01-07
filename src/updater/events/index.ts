import { config } from "../../../config";
import { getDistributionChats, getGroupsChats, getGroupsNoticeNextWeekChats, getNoticeErrorsChats, getTeachersChats, getTeachersNoticeNextWeekChats } from "../../db";
import { MessageOptions } from "../../services/bots/abstract";
import { AbstractChat, ChatMode, DbChat } from "../../services/bots/abstract/chat";
import { Service } from "../../services/bots/abstract/command";
import { DayIndex, WeekIndex, createScheduleFormatter, getFutureDays, parseStrToDate, prepareError } from "../../utils";
import { GroupDay, TeacherDay } from "../parser/types";
import { raspCache, saveCache } from "../raspCache";
import { EventController } from "./controller";

function getDayPhrase(day: string, nextDayPhrase: string = 'день'): string {
    if (WeekIndex.fromStringDate(day).isFutureWeek()) {
        return 'следующую неделю';
    }

    const dayIndex = DayIndex.fromStringDate(day);

    if (dayIndex.isToday()) {
        return 'сегодня';
    }

    if (dayIndex.isTomorrow()) {
        return 'завтра';
    }

    return nextDayPhrase;
}

export type ProgressCallback = (data: {
    position: number,
    count: number
}) => void

export abstract class AbstractEventListener<T extends AbstractChat = AbstractChat> {
    protected abstract _tableName: string;
    public readonly abstract service: Service;

    constructor(enabled: boolean) {
        if (!enabled) return;

        EventController.registerService(this);
    }

    protected abstract createChat(chat: DbChat): T;
    protected abstract sendMessage(chat: T, message: string, options?: MessageOptions): Promise<any>;

    protected async sendMessages(chats: T | T[], message: string, options?: MessageOptions, cb?: ProgressCallback): Promise<void> {
        if (!Array.isArray(chats)) {
            chats = [chats];
        }

        if (cb) {
            cb({ position: 0, count: chats.length })
        }

        for (const i in chats) {
            const chat = chats[i];

            await this.sendMessage(chat, message, options);

            if (cb) {
                cb({ position: +i + 1, count: chats.length })
            }
        }
    }

    protected getGroupsChats<T>(groups: string | string[]): T[] {
        if (!Array.isArray(groups)) groups = [groups];

        const chats: T[] = getGroupsChats(this._tableName, this.service, groups)
            .map((chat: any) => this.createChat(chat));

        return chats;
    }

    protected getTeachersChats<T>(teachers: string | string[]): T[] {
        if (!Array.isArray(teachers)) teachers = [teachers];

        const chats: T[] = getTeachersChats(this._tableName, this.service, teachers)
            .map((chat: any) => this.createChat(chat));

        return chats;
    }

    public async nextGroupDay({ index }: { index: number }) {
        const groups: string[] = Object.entries(raspCache.groups.timetable).map(([group, { days }]): [string, GroupDay | undefined] => {
            const todayDay = days.find((day) => {
                return DayIndex.fromStringDate(day.day).isToday();
            });

            return [group, todayDay];
        }).filter(([, day]): boolean => {
            if (!day) return false;

            return (day.lessons.length === index + 1) || (day.lessons.length === 0 && index + 1 === config.updater.lessonIndexIfEmpty);
        }).map(([group]): string => {
            return group;
        });

        const chats: T[] = this.getGroupsChats(groups);
        if (chats.length === 0) return;

        const chatsKeyed: { [group: string]: T[] } = chats.reduce<{ [group: string]: T[] }>((obj, chat: T) => {
            const group: string = String(chat.group!);

            if (!obj[group]) {
                obj[group] = [];
            }

            obj[group].push(chat);

            return obj;
        }, {});

        for (const group in chatsKeyed) {
            const groupEntry = raspCache.groups.timetable[group];
            const chats: T[] = chatsKeyed[group];

            const nextDays = getFutureDays(groupEntry.days);
            if (!nextDays.length) continue;

            //если дальше всё расписание пустое, то больше не оповещаем
            const isEmpty: boolean = nextDays.every(day => day.lessons.length === 0);
            if (isEmpty) continue;

            const day = nextDays[0];

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
            if (groupEntry.lastNoticedDay && dayIndex <= groupEntry.lastNoticedDay) {
                continue;
            }

            EventController.deferFunction(`updateLastGroupNoticedDay_${group}`, async () => {
                groupEntry.lastNoticedDay = dayIndex;
                await saveCache();
            })

            const phrase: string = getDayPhrase(day.day, 'следующий день');

            for (const chat of chats) {
                const formatter = createScheduleFormatter(this.service, raspCache, chat);

                const message: string = [
                    `📢 Расписание на ${phrase}\n`,
                    formatter.formatGroupFull(group, {
                        showHeader: false,
                        days: [day]
                    })
                ].join('\n');

                await this.sendMessage(chat, message);
            }
        }
    }

    public async sendGroupDay({ day, group }: { day: GroupDay, group: string }) {
        const chats: T[] = this.getGroupsChats(group);
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day, 'следующий день');

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, chat);

            const message: string = [
                `📢 Расписание на ${phrase}\n`,
                formatter.formatGroupFull(group, {
                    showHeader: false,
                    days: [day]
                })
            ].join('\n');

            await this.sendMessage(chat, message);
        }
    }

    public async updateGroupDay({ day, group }: { day: GroupDay, group: string }) {
        const chats: T[] = this.getGroupsChats(group);
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day);

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, chat);

            const message: string = [
                `🆕 Изменено расписание ${phrase}\n`,
                formatter.formatGroupFull(group, {
                    showHeader: false,
                    days: [day]
                })
            ].join('\n');

            await this.sendMessage(chat, message);
        }
    }

    public async nextTeacherDay({ index }: { index: number }) {
        const today: number = DayIndex.now().valueOf();

        const teachers: string[] = Object.entries(raspCache.teachers.timetable).map(([teacher, { days }]): [string, TeacherDay | undefined] => {
            const todayDay = days.find((day) => {
                return DayIndex.fromStringDate(day.day).isToday();
            });

            return [teacher, todayDay];
        }).filter(([, day]): boolean => {
            if (!day) return false;

            return (day.lessons.length === index + 1) || (day.lessons.length === 0 && index + 1 === config.updater.lessonIndexIfEmpty);
        }).map(([teacher]): string => {
            return teacher;
        });

        const chats: T[] = this.getTeachersChats(teachers);
        if (chats.length === 0) return;

        const chatsKeyed: { [teacher: string]: T[] } = chats.reduce<{ [teacher: string]: T[] }>((obj, chat: T) => {
            const teacher: string = String(chat.teacher!);

            if (!obj[teacher]) {
                obj[teacher] = [];
            }

            obj[teacher].push(chat);

            return obj;
        }, {});

        for (const teacher in chatsKeyed) {
            const teacherEntry = raspCache.teachers.timetable[teacher];
            const chats: T[] = chatsKeyed[teacher];

            const nextDays = getFutureDays(teacherEntry.days);
            if (!nextDays.length) continue;

            //если дальше всё расписание пустое, то больше не оповещаем
            const isEmpty: boolean = nextDays.every(day => day.lessons.length === 0);
            if (isEmpty) continue;

            const day = nextDays[0];

            const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
            if (teacherEntry.lastNoticedDay && dayIndex <= teacherEntry.lastNoticedDay) {
                continue;
            }

            EventController.deferFunction(`updateLastTeacherNoticedDay_${teacher}`, async () => {
                teacherEntry.lastNoticedDay = dayIndex;
                await saveCache();
            })

            const phrase: string = getDayPhrase(day.day, 'следующий день');

            for (const chat of chats) {
                const formatter = createScheduleFormatter(this.service, raspCache, chat);

                const message: string = [
                    `📢 Расписание на ${phrase}\n`,
                    formatter.formatTeacherFull(teacher, {
                        showHeader: false,
                        days: [day]
                    })
                ].join('\n');

                await this.sendMessage(chat, message);
            }
        }
    }

    public async sendTeacherDay({ day, teacher }: { day: TeacherDay, teacher: string }) {
        const chats: T[] = this.getTeachersChats(teacher);
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day, 'следующий день');

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, chat);

            const message: string = [
                `📢 Расписание на ${phrase}\n`,
                formatter.formatTeacherFull(teacher, {
                    showHeader: false,
                    days: [day]
                })
            ].join('\n');

            await this.sendMessage(chat, message);
        }
    }

    public async updateTeacherDay({ day, teacher }: { day: TeacherDay, teacher: string }) {
        const chats: T[] = this.getTeachersChats(teacher);
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day);

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, chat);

            const message: string = [
                `🆕 Изменено расписание ${phrase}\n`,
                formatter.formatTeacherFull(teacher, {
                    showHeader: false,
                    days: [day]
                })
            ].join('\n');

            await this.sendMessage(chat, message);
        }
    }

    public async sendNextWeek(chatMode: ChatMode, weekIndex: number) {
        const firstWeekDay = WeekIndex.fromNumber(weekIndex).getFirstDayDate();

        let chats: T[] | undefined;

        if (chatMode === 'student') {
            const groups: string[] = Object.entries(raspCache.groups.timetable).map(([group, { days }]): [string, GroupDay[]] => {
                const daysOfWeek = days.filter((day) => {
                    return parseStrToDate(day.day) >= firstWeekDay && day.lessons.length > 0;
                });

                return [group, daysOfWeek];
            }).filter(([, days]): boolean => {
                return days.length > 0;
            }).map(([group]): string => {
                return group;
            });

            chats = getGroupsNoticeNextWeekChats(this._tableName, this.service, groups)
                .map((chat: any) => this.createChat(chat));
        }

        if (chatMode === 'teacher') {
            const teachers: string[] = Object.entries(raspCache.teachers.timetable).map(([group, { days }]): [string, TeacherDay[]] => {
                const daysOfWeek = days.filter((day) => {
                    return parseStrToDate(day.day) >= firstWeekDay && day.lessons.length > 0;
                });

                return [group, daysOfWeek];
            }).filter(([, days]): boolean => {
                return days.length > 0;
            }).map(([teacher]): string => {
                return teacher;
            });

            chats = getTeachersNoticeNextWeekChats(this._tableName, this.service, teachers)
                .map((chat: any) => this.createChat(chat));
        }

        if (!chats || chats.length === 0) return;

        return this.sendMessages(chats, '🆕 Доступно расписание на следующую неделю');
    }

    public async sendDistribution(message: string, cb?: ProgressCallback) {
        const chats: T[] = getDistributionChats(this._tableName, this.service)
            .map((chat: any) => this.createChat(chat));

        return this.sendMessages(chats, message, undefined, cb);
    }

    public async sendError(error: Error) {
        const chats: T[] = getNoticeErrorsChats(this._tableName, this.service)
            .map((chat: any) => this.createChat(chat));

        return this.sendMessages(chats, [
            '‼️ Произошла ошибка парсера ‼️\n',
            prepareError(error)
        ].join('\n'));
    }
}