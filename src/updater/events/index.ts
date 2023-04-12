import { config } from "../../../config";
import db from "../../db";
import { DbChat } from "../../services/bots/abstract/chat";
import { buildGroupTextRasp, buildTeacherTextRasp, getDayNext, getTodayDate, strDateToNumber } from "../../utils";
import { GroupDay, TeacherDay } from "../parser/types";
import { raspCache } from "../raspCache";
import { EventController } from "./controller";

export abstract class AbstractEventListener<T extends DbChat = DbChat> {
    protected abstract _tableName: string;

    constructor(enabled: boolean) {
        if (!enabled) return;

        EventController.registerEvent(this);
    }

    protected abstract sendMessage(chat: T, message: string): Promise<any>;

    protected async sendMessages(chats: T | T[], message: string): Promise<void> {
        if (!Array.isArray(chats)) {
            chats = [chats]
        }

        for (const chat of chats) {
            await this.sendMessage(chat, message)
        }
    }

    protected getGroupsChats<T>(groups: string | string[]): T[] {
        if (!Array.isArray(groups)) groups = [groups];

        const chats: T[] = db.prepare(
            "SELECT * FROM `" + this._tableName + "` WHERE `group` IN (" + Array(groups.length).fill('?') + ") AND (`deactivateSecondaryCheck` = 1 OR `mode` = 'student' OR `mode` = 'parent') AND `accepted` = 1 AND `noticeChanges` = 1 AND `allowSendMess` = 1"
        ).all(...groups);

        return chats;
    }

    protected getTeachersChats<T>(teachers: string | string[]): T[] {
        if (!Array.isArray(teachers)) teachers = [teachers];

        const chats: T[] = db.prepare(
            "SELECT * FROM `" + this._tableName + "` WHERE `teacher` IN (" + Array(teachers.length).fill('?') + ") AND (`deactivateSecondaryCheck` = 1 OR `mode` = 'teacher') AND `accepted` = 1 AND `noticeChanges` = 1 AND `allowSendMess` = 1"
        ).all(...teachers);

        return chats;
    }

    public async nextGroupDay({ index }: { index: number }) {
        const today: number = getTodayDate();

        const groups: string[] = Object.entries(raspCache.groups.timetable).map(([group, { days }]): [string, GroupDay | undefined] => {
            const todayDay = days.find((day) => {
                return strDateToNumber(day.day) === today;
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
                obj[group] = []
            }

            obj[group].push(chat);

            return obj;
        }, {});

        for (const group in chatsKeyed) {
            const chats: T[] = chatsKeyed[group];

            const day = getDayNext(raspCache.groups.timetable[group].days);
            if (!day) continue;

            const message: string = [
                '📢 Расписание на следующий день\n',
                buildGroupTextRasp(group, [day], false, false)
            ].join('\n')

            await this.sendMessages(chats, message)
        }
    }

    public async updateGroupDay({ day, group }: { day: GroupDay, group: string }) {
        const chats: T[] = this.getGroupsChats(group);
        if (chats.length === 0) return;

        const message: string = [
            '🆕 Изменено расписание на день\n',
            buildGroupTextRasp(group, [day], false, false)
        ].join('\n')

        await this.sendMessages(chats, message)
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
        const today: number = getTodayDate();

        const teachers: string[] = Object.entries(raspCache.teachers.timetable).map(([teacher, { days }]): [string, TeacherDay | undefined] => {
            const todayDay = days.find((day) => {
                return strDateToNumber(day.day) === today;
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
                obj[teacher] = []
            }

            obj[teacher].push(chat);

            return obj;
        }, {});

        for (const teacher in chatsKeyed) {
            const chats: T[] = chatsKeyed[teacher];

            const day = getDayNext(raspCache.teachers.timetable[teacher].days);
            if (!day) continue;

            const message: string = [
                '📢 Расписание на следующий день\n',
                buildTeacherTextRasp(teacher, [day], false, false)
            ].join('\n')

            await this.sendMessages(chats, message)
        }
    }

    public async updateTeacherDay({ day, teacher }: { day: TeacherDay, teacher: string }) {
        const chats: T[] = this.getTeachersChats(teacher);
        if (chats.length === 0) return;

        const message: string = [
            '🆕 Изменено расписание на день\n',
            buildTeacherTextRasp(teacher, [day], false, false)
        ].join('\n')

        await this.sendMessages(chats, message)
    }

    public async sendDistribution(message: string) {
        const chats: T[] = db.prepare(
            "SELECT * FROM `" + this._tableName + "` WHERE `accepted` = 1 AND `allowSendMess` = 1"
        ).all();

        return this.sendMessages(chats, message);
    }

    // public abstract addGroupWeek(data: { week: string, teacher: string }): any;
    // public abstract addTeacherWeek(data: { week: string, teacher: string }): any;
}