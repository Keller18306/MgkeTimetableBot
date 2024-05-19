import { InferAttributes, ModelStatic, Op, WhereOptions } from "sequelize";
import { config } from "../../../../config";
import { App } from "../../../app";
import { createScheduleFormatter } from "../../../formatter";
import { DayIndex, StringDate, WeekIndex, getFutureDays, prepareError } from "../../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../../parser";
import { raspCache, saveCache } from "../../parser/raspCache";
import { GroupDay, TeacherDay } from "../../parser/types";
import { MessageOptions } from "../abstract";
import { BotServiceName } from "../abstract/command";
import { AbstractServiceChat, BotChat, ChatMode } from "../chat";

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

export type CronDay = {
    index: number,
    latest?: boolean
}

export abstract class AbstractBotEventListener {
    protected abstract _model: ModelStatic<AbstractServiceChat>;
    public readonly abstract service: BotServiceName;

    constructor(protected app: App) { }

    // protected abstract createChat(chat: DbChat): T;
    public abstract sendMessage(chat: BotChat, message: string, options?: MessageOptions): Promise<any>;

    protected getBotEventControlller() {
        return this.app.getService('bot').events;
    }

    protected async sendMessages(chats: BotChat | BotChat[], message: string, options?: MessageOptions, cb?: ProgressCallback): Promise<void> {
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

    protected async getChats(where?: WhereOptions<InferAttributes<BotChat>>): Promise<BotChat[]> {
        return BotChat.findAll({
            where: Object.assign({
                accepted: true,
                allowSendMess: true,
                service: this.service,
                ...(config.dev ? {
                    noticeParserErrors: true
                } : {})
            }, where),
            include: {
                association: BotChat.associations[this._model.name],
                required: true
            },
        }).then(chats => {
            return chats.map(chat => {
                chat.serviceChat = (chat as any)[this._model.name];

                return chat;
            });
        });
    }

    protected async getGroupsChats<T>(group: string | string[], where?: WhereOptions<InferAttributes<BotChat>>): Promise<BotChat[]> {
        return this.getChats(Object.assign({
            group: group,
            [Op.or]: {
                deactivateSecondaryCheck: true,
                mode: ['student', 'parent']
            },
        }, where));
    }

    protected getTeachersChats<T>(teacher: string | string[], where?: WhereOptions<InferAttributes<BotChat>>): Promise<BotChat[]> {
        return this.getChats(Object.assign({
            teacher: teacher,
            [Op.or]: {
                deactivateSecondaryCheck: true,
                mode: 'teacher'
            },
        }, where));
    }

    public async cronGroupDay({ index, latest }: CronDay) {
        const groups: string[] = Object.entries(raspCache.groups.timetable)
            .map(([group, { days }]): [string, GroupDay | undefined] => {
                const todayDay = days.find((day) => {
                    return DayIndex.fromStringDate(day.day).isToday();
                });

                return [group, todayDay];
            }).filter(([, day]): boolean => {
                if (!day) return false;

                return (latest ? (day.lessons.length >= index + 1) : (day.lessons.length === index + 1)) ||
                    (day.lessons.length === 0 && index + 1 === config.parser.lessonIndexIfEmpty);
            }).map(([group]): string => {
                return group;
            });

        const chats: BotChat[] = await this.getGroupsChats(groups, { noticeChanges: true });
        if (chats.length === 0) return;

        const chatsKeyed: { [group: string]: BotChat[] } = chats.reduce<{ [group: string]: BotChat[] }>((obj, chat: BotChat) => {
            const group: string = String(chat.group!);

            if (!obj[group]) {
                obj[group] = [];
            }

            obj[group].push(chat);

            return obj;
        }, {});

        for (const group in chatsKeyed) {
            const groupEntry = raspCache.groups.timetable[group];
            const chats: BotChat[] = chatsKeyed[group];

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

            this.getBotEventControlller().deferFunction(`updateLastGroupNoticedDay_${group}`, async () => {
                groupEntry.lastNoticedDay = dayIndex;
                await saveCache();
            })

            const phrase: string = getDayPhrase(day.day, 'следующий день');

            for (const chat of chats) {
                const formatter = createScheduleFormatter(this.service, this.app, raspCache, chat);

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

    public async addGroupDay({ day, group }: GroupDayEvent) {
        const chats: BotChat[] = await this.getGroupsChats(group, { noticeChanges: true });
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day, 'следующий день');

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, this.app, raspCache, chat);

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

    public async updateGroupDay({ day, group }: GroupDayEvent) {
        const chats: BotChat[] = await this.getGroupsChats(group, { noticeChanges: true });
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day);

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, this.app, raspCache, chat);

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

    public async cronTeacherDay({ index, latest }: CronDay) {
        const teachers: string[] = Object.entries(raspCache.teachers.timetable)
            .map(([teacher, { days }]): [string, TeacherDay | undefined] => {
                const todayDay = days.find((day) => {
                    return DayIndex.fromStringDate(day.day).isToday();
                });

                return [teacher, todayDay];
            }).filter(([, day]): boolean => {
                if (!day) return false;

                return (latest ? (day.lessons.length >= index + 1) : (day.lessons.length === index + 1)) ||
                    (day.lessons.length === 0 && index + 1 === config.parser.lessonIndexIfEmpty);
            }).map(([teacher]): string => {
                return teacher;
            });

        const chats: BotChat[] = await this.getTeachersChats(teachers, { noticeChanges: true });
        if (chats.length === 0) return;

        const chatsKeyed: { [teacher: string]: BotChat[] } = chats.reduce<{ [teacher: string]: BotChat[] }>((obj, chat: BotChat) => {
            const teacher: string = String(chat.teacher!);

            if (!obj[teacher]) {
                obj[teacher] = [];
            }

            obj[teacher].push(chat);

            return obj;
        }, {});

        for (const teacher in chatsKeyed) {
            const teacherEntry = raspCache.teachers.timetable[teacher];
            const chats: BotChat[] = chatsKeyed[teacher];

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

            this.getBotEventControlller().deferFunction(`updateLastTeacherNoticedDay_${teacher}`, async () => {
                teacherEntry.lastNoticedDay = dayIndex;
                await saveCache();
            })

            const phrase: string = getDayPhrase(day.day, 'следующий день');

            for (const chat of chats) {
                const formatter = createScheduleFormatter(this.service, this.app, raspCache, chat);

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

    public async addTeacherDay({ day, teacher }: TeacherDayEvent) {
        const chats: BotChat[] = await this.getTeachersChats(teacher, { noticeChanges: true });
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day, 'следующий день');

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, this.app, raspCache, chat);

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

    public async updateTeacherDay({ day, teacher }: TeacherDayEvent) {
        const chats: BotChat[] = await this.getTeachersChats(teacher, { noticeChanges: true });
        if (chats.length === 0) return;

        const phrase: string = getDayPhrase(day.day);

        for (const chat of chats) {
            const formatter = createScheduleFormatter(this.service, this.app, raspCache, chat);

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

    public async updateWeek(chatMode: ChatMode, weekIndex: number) {
        const firstWeekDay = WeekIndex.fromWeekIndexNumber(weekIndex).getFirstDayDate();

        let chats: BotChat[] | undefined;

        if (chatMode === 'student') {
            const groups: string[] = Object.entries(raspCache.groups.timetable).map(([group, { days }]): [string, GroupDay[]] => {
                const daysOfWeek = days.filter((day) => {
                    return StringDate.fromStringDate(day.day).toDate() >= firstWeekDay && day.lessons.length > 0;
                });

                return [group, daysOfWeek];
            }).filter(([, days]): boolean => {
                return days.length > 0;
            }).map(([group]): string => {
                return group;
            });

            chats = await this.getGroupsChats(groups, { noticeNextWeek: true });
        }

        if (chatMode === 'teacher') {
            const teachers: string[] = Object.entries(raspCache.teachers.timetable).map(([group, { days }]): [string, TeacherDay[]] => {
                const daysOfWeek = days.filter((day) => {
                    return StringDate.fromStringDate(day.day).toDate() >= firstWeekDay && day.lessons.length > 0;
                });

                return [group, daysOfWeek];
            }).filter(([, days]): boolean => {
                return days.length > 0;
            }).map(([teacher]): string => {
                return teacher;
            });

            chats = await this.getTeachersChats(teachers, { noticeNextWeek: true });
        }

        if (!chats || chats.length === 0) return;

        return this.sendMessages(chats, '🆕 Доступно расписание на следующую неделю');
    }

    public async sendDistribution(message: string, cb?: ProgressCallback) {
        const chats: BotChat[] = await this.getChats({
            subscribeDistribution: true
        });

        return this.sendMessages(chats, message, undefined, cb);
    }

    public async sendError(error: Error) {
        const chats: BotChat[] = await this.getChats({
            noticeParserErrors: true
        });

        return this.sendMessages(chats, [
            '‼️ Произошла ошибка парсера ‼️\n',
            prepareError(error)
        ].join('\n'));
    }
}