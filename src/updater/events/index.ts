import { config } from "../../../config";
import { getDistributionChats, getGroupsChats, getNoticeErrorsChats, getNoticeNextWeekChats, getTeachersChats } from "../../db";
import { AbstractChat, ChatMode, DbChat } from "../../services/bots/abstract/chat";
import { Service } from "../../services/bots/abstract/command";
import { createScheduleFormatter, getDayIndex, getNextDays, isNextWeek, isToday, prepareError, strDateToIndex } from "../../utils";
import { GroupDay, TeacherDay } from "../parser/types";
import { raspCache } from "../raspCache";
import { EventController } from "./controller";

export abstract class AbstractEventListener<T extends DbChat = DbChat> {
    protected abstract _tableName: string;
    protected abstract service: Service;

    constructor(enabled: boolean) {
        if (!enabled) return;

        EventController.registerService(this);
    }

    protected abstract createChat(chat: T): AbstractChat;
    protected abstract sendMessage(chat: T, message: string): Promise<any>;

    protected async sendMessages(chats: T | T[], message: string): Promise<void> {
        if (!Array.isArray(chats)) {
            chats = [chats];
        }

        for (const chat of chats) {
            await this.sendMessage(chat, message);
        }
    }

    protected getGroupsChats<T>(groups: string | string[]): T[] {
        if (!Array.isArray(groups)) groups = [groups];

        const chats: T[] = getGroupsChats(this._tableName, this.service, groups);

        return chats;
    }

    protected getTeachersChats<T>(teachers: string | string[]): T[] {
        if (!Array.isArray(teachers)) teachers = [teachers];

        const chats: T[] = getTeachersChats(this._tableName, this.service, teachers);

        return chats;
    }

    public async nextGroupDay({ index }: { index: number }) {
        const today: number = getDayIndex();

        const groups: string[] = Object.entries(raspCache.groups.timetable).map(([group, { days }]): [string, GroupDay | undefined] => {
            const todayDay = days.find((day) => {
                return strDateToIndex(day.day) === today;
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

            const nextDays = getNextDays(groupEntry.days);
            if (!nextDays.length) continue;

            //если дальше всё расписание пустое, то больше не оповещаем
            const isEmpty: boolean = nextDays.every(day => day.lessons.length === 0);
            if (isEmpty) continue;

            const day = nextDays[0];

            const dayIndex = strDateToIndex(day.day);
            if (groupEntry.lastNoticedDay && dayIndex <= groupEntry.lastNoticedDay) {
                continue;
            }
            groupEntry.lastNoticedDay = dayIndex;

            const phrase: string = isNextWeek(day.day) ? 'следующую неделю' : 'следующий день';

            for (const chat of chats) {
                const formatter = createScheduleFormatter(this.service, raspCache, this.createChat(chat));

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
        const groupEntry = raspCache.groups.timetable[group];
        const dayIndex = strDateToIndex(day.day);
        if (groupEntry.lastNoticedDay && dayIndex <= groupEntry.lastNoticedDay) {
            return;
        }
        groupEntry.lastNoticedDay = dayIndex;

        const chats: T[] = this.getGroupsChats(group);
        if (chats.length === 0) return;

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, this.createChat(chat));

            const message: string = [
                '📢 Расписание на следующий день\n',
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

        const phrase: string = isToday(day.day) ? 'на сегодня' : 'на день';

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, this.createChat(chat));

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

    // public async nextTeacherDay({ day, teacher }: { day: TeacherDay, teacher: string }) {
    //     const chats: T[] = this.getTeachersChats(teacher);
    //     if (chats.length === 0) return;

    //     const message: string = [
    //         '📢 Расписание на следующий день\n',
    //         buildTeacherTextRasp(teacher, [day], false, false)
    //     ].join('\n')

    //     await this.sendMessages(chats, message)
    // }

    public async nextTeacherDay({ index }: { index: number }) {
        const today: number = getDayIndex();

        const teachers: string[] = Object.entries(raspCache.teachers.timetable).map(([teacher, { days }]): [string, TeacherDay | undefined] => {
            const todayDay = days.find((day) => {
                return strDateToIndex(day.day) === today;
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

            const nextDays = getNextDays(teacherEntry.days);
            if (!nextDays.length) continue;

            //если дальше всё расписание пустое, то больше не оповещаем
            const isEmpty: boolean = nextDays.every(day => day.lessons.length === 0);
            if (isEmpty) continue;

            const day = nextDays[0];

            const dayIndex = strDateToIndex(day.day);
            if (teacherEntry.lastNoticedDay && dayIndex <= teacherEntry.lastNoticedDay) {
                continue;
            }
            teacherEntry.lastNoticedDay = dayIndex;

            const phrase: string = isNextWeek(day.day) ? 'следующую неделю' : 'следующий день';

            for (const chat of chats) {
                const formatter = createScheduleFormatter(this.service, raspCache, this.createChat(chat));

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
        const teacherEntry = raspCache.teachers.timetable[teacher];
        const dayIndex = strDateToIndex(day.day);
        if (teacherEntry.lastNoticedDay && dayIndex <= teacherEntry.lastNoticedDay) {
            return;
        }
        teacherEntry.lastNoticedDay = dayIndex;

        const chats: T[] = this.getTeachersChats(teacher);
        if (chats.length === 0) return;

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, this.createChat(chat));

            const message: string = [
                '📢 Расписание на следующий день\n',
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

        const phrase: string = isToday(day.day) ? 'на сегодня' : 'на день';

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, raspCache, this.createChat(chat));

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

    public async sendNextWeek(chatMode: ChatMode) {
        const chats: T[] = getNoticeNextWeekChats(this._tableName, this.service, chatMode);

        return this.sendMessages(chats, '🆕 Доступно расписание на следующую неделю');
    }

    public async sendDistribution(message: string) {
        const chats: T[] = getDistributionChats(this._tableName, this.service);

        return this.sendMessages(chats, message);
    }

    public async sendError(error: Error) {
        const chats: T[] = getNoticeErrorsChats(this._tableName, this.service);

        return this.sendMessages(chats, [
            '‼️ Произошла ошибка парсера ‼️\n',
            prepareError(error)
        ].join('\n'));
    }
}