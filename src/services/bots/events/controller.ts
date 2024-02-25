import { AbstractBotEventListener, CronDay, ProgressCallback } from ".";
import { config } from "../../../../config";
import { App } from "../../../app";
import { DayIndex } from "../../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../../parser";
import { raspCache, saveCache } from "../../parser/raspCache";
import { GroupLesson, GroupLessonExplain, TeacherLesson, TeacherLessonExplain } from "../../timetable";
import { BotServiceName, ChatMode } from "../abstract";

export type ServiceProgressCallback = (data: { service: BotServiceName } & Parameters<ProgressCallback>[0]) => void;

export class BotEventController {
    private serviceList: AbstractBotEventListener[] = [];
    private deferred: { [id: string]: () => any } = {};

    constructor(private app: App) { }

    public run() {
        const ev = this.app.getService('parser').events;

        ev.on('addGroupDay', this.addGroupDay.bind(this));
        ev.on('updateGroupDay', this.updateGroupDay.bind(this));

        ev.on('addTeacherDay', this.addTeacherDay.bind(this));
        ev.on('updateTeacherDay', this.updateTeacherDay.bind(this));

        ev.on('updateWeek', this.updateWeek.bind(this));

        ev.on('error', this.sendError.bind(this));
    }

    public registerListener(service: AbstractBotEventListener) {
        this.serviceList.push(service);
    }

    public async cronGroupDay(data: CronDay) {
        for (const service of this.serviceList) {
            await service.cronGroupDay(data);
        }

        await this.runDeferredFunctions();
    }

    public async cronTeacherDay(data: CronDay) {
        for (const service of this.serviceList) {
            await service.cronTeacherDay(data);
        }

        await this.runDeferredFunctions();
    }

    public async addGroupDay(data: GroupDayEvent) {
        const { day, group } = data;

        const groupEntry = raspCache.groups.timetable[group];
        const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
        if (groupEntry.lastNoticedDay && dayIndex <= groupEntry.lastNoticedDay) {
            return;
        }

        groupEntry.lastNoticedDay = dayIndex;

        if (this.hasAlertableGroupLessons(day.lessons)) {
            const promises: Promise<void>[] = [];

            for (const service of this.serviceList) {
                promises.push(service.addGroupDay(data));
            }

            await Promise.all(promises);
        }

        await saveCache();
    }

    public async updateGroupDay(data: GroupDayEvent) {
        if (!this.hasAlertableGroupLessons(data.day.lessons)) {
            return;
        }

        const promises: Promise<void>[] = [];

        for (const service of this.serviceList) {
            promises.push(service.updateGroupDay(data));
        }

        await Promise.all(promises);
    }

    public async addTeacherDay(data: TeacherDayEvent) {
        const { day, teacher } = data;

        const teacherEntry = raspCache.teachers.timetable[teacher];
        const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
        if (teacherEntry.lastNoticedDay && dayIndex <= teacherEntry.lastNoticedDay) {
            return;
        }

        teacherEntry.lastNoticedDay = dayIndex;

        if (this.hasAlertableTeacherLessons(data.day.lessons)) {
            const promises: Promise<void>[] = [];

            for (const service of this.serviceList) {
                promises.push(service.addTeacherDay(data));
            }

            await Promise.all(promises);
        }

        await saveCache();
    }

    public async updateTeacherDay(data: TeacherDayEvent) {
        if (!this.hasAlertableTeacherLessons(data.day.lessons)) {
            return;
        }

        const promises: Promise<void>[] = [];

        for (const service of this.serviceList) {
            promises.push(service.updateTeacherDay(data));
        }

        await Promise.all(promises);
    }

    public async updateWeek(chatMode: ChatMode, weekIndex: number) {
        for (const service of this.serviceList) {
            await service.updateWeek(chatMode, weekIndex);
        }
    }

    public async sendDistibution(message: string, cb?: ServiceProgressCallback) {
        for (const service of this.serviceList) {
            await service.sendDistribution(message, cb ? (data) => {
                cb(Object.assign({ service: service.service }, data))
            } : undefined);
        }
    }

    public async sendError(error: Error) {
        for (const service of this.serviceList) {
            await service.sendError(error);
        }
    }

    public deferFunction(id: string, func: () => any) {
        if (this.deferred[id]) return;

        this.deferred[id] = func;
    }

    private async runDeferredFunctions() {
        for (const id in this.deferred) {
            const defer = this.deferred[id];

            try {
                await defer();
            } catch (e) {
                console.log('deferred function error', e)
            }

            delete this.deferred[id];
        }
    }

    private hasAlertableGroupLessons(_lessons: GroupLesson[]): boolean {
        return _lessons.reduce((store: GroupLessonExplain[], lesson) => {
            if (lesson === null) {
                return store;
            }

            const lessons = Array.isArray(lesson) ? lesson : [lesson];
            store.push(...lessons);

            return store;
        }, []).filter((value) => {
            let valid: boolean = true;

            for (const filter of config.parser.alertableIgnoreFilter.group) {
                if (filter.lesson === value.lesson && filter.type === value.type) {
                    valid = false;
                    break;
                }
            }

            return valid;
        }).length > 0;
    }

    private hasAlertableTeacherLessons(_lessons: TeacherLesson[]): boolean {
        return _lessons.reduce((store: TeacherLessonExplain[], lesson) => {
            if (lesson === null) {
                return store;
            }

            store.push(lesson);

            return store;
        }, []).filter((value) => {
            let valid: boolean = true;

            for (const filter of config.parser.alertableIgnoreFilter.teacher) {
                if (filter.lesson === value.lesson && filter.type === value.type) {
                    valid = false;
                    break;
                }
            }

            return valid;
        }).length > 0;
    }
}
