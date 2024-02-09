import { AbstractBotEventListener, ProgressCallback } from ".";
import { App } from "../../../app";
import { DayIndex } from "../../../utils";
import { GroupDayEvent, TeacherDayEvent } from "../../parser";
import { raspCache, saveCache } from "../../parser/raspCache";
import { ChatMode, Service } from "../abstract";

export type ServiceProgressCallback = (data: { service: Service } & Parameters<ProgressCallback>[0]) => void;

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

    public async cronGroupDay(data: { index: number }) {
        for (const service of this.serviceList) {
            await service.cronGroupDay(data);
        }

        await this.runDeferredFunctions();
    }

    public async cronTeacherDay(data: { index: number }) {
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

        for (const service of this.serviceList) {
            await service.addGroupDay(data);
        }

        await saveCache();
    }

    public async updateGroupDay(data: GroupDayEvent) {
        for (const service of this.serviceList) {
            await service.updateGroupDay(data);
        }
    }

    public async addTeacherDay(data: TeacherDayEvent) {
        const { day, teacher } = data;

        const teacherEntry = raspCache.teachers.timetable[teacher];
        const dayIndex = DayIndex.fromStringDate(day.day).valueOf();
        if (teacherEntry.lastNoticedDay && dayIndex <= teacherEntry.lastNoticedDay) {
            return;
        }

        teacherEntry.lastNoticedDay = dayIndex;

        for (const service of this.serviceList) {
            await service.addTeacherDay(data);
        }

        await saveCache();
    }

    public async updateTeacherDay(data: TeacherDayEvent) {
        for (const service of this.serviceList) {
            await service.updateTeacherDay(data);
        }
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
}
