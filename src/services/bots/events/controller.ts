import { AbstractBotEventListener, ProgressCallback } from ".";
import { GroupDayEvent, TeacherDayEvent, Updater } from "../../../updater";
import { raspCache, saveCache } from "../../../updater/raspCache";
import { DayIndex } from "../../../utils";
import { ChatMode, Service } from "../abstract";

export type ServiceProgressCallback = (data: { service: Service } & Parameters<ProgressCallback>[0]) => void;

export class BotEventController {
    private static _instance: BotEventController;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new BotEventController();
        }

        return this._instance;
    }

    public static async nextGroupDay(data: { index: number }) {
        const { serviceList, runDeferredFunctions } = this.getInstance();

        for (const service of serviceList) {
            await service.nextGroupDay(data);
        }

        await runDeferredFunctions();
    }

    public static async cronTeacherDay(data: { index: number }) {
        const { serviceList, runDeferredFunctions } = this.getInstance();

        for (const service of serviceList) {
            await service.cronTeacherDay(data);
        }

        await runDeferredFunctions();
    }

    private serviceList: AbstractBotEventListener[] = [];
    private deferred: { [id: string]: () => any } = {};

    private constructor() {
        const ev = Updater.getInstance().events;

        ev.on('addGroupDay', this.addGroupDay.bind(this));
        ev.on('updateGroupDay', this.updateGroupDay.bind(this));

        ev.on('addTeacherDay', this.addTeacherDay.bind(this));
        ev.on('updateTeacherDay', this.updateTeacherDay.bind(this));

        ev.on('updateWeek', this.updateWeek.bind(this));

        ev.on('error', this.sendError.bind(this));
    }

    public registerService(service: AbstractBotEventListener) {
        this.serviceList.push(service);
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
