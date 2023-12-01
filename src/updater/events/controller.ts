import { AbstractEventListener, ProgressCallback } from ".";
import { ChatMode, Service } from "../../services/bots/abstract";
import { strDateToIndex } from "../../utils";
import { GroupDay, TeacherDay } from "../parser/types";
import { raspCache, saveCache } from "../raspCache";

export type ServiceProgressCallback = (data: { service: Service } & Parameters<ProgressCallback>[0]) => void;

export class EventController {
    protected static serviceList: AbstractEventListener[] = [];
    private static deferred: { [id: string]: () => any } = {};

    public static registerService(service: AbstractEventListener) {
        this.serviceList.push(service);
    }

    public static async nextGroupDay(data: { index: number }) {
        for (const service of this.serviceList) {
            await service.nextGroupDay(data);
        }

        await this.runDeferredFunctions();
    }

    public static async sendGroupDay(data: { day: GroupDay, group: string }) {
        const { day, group } = data;

        const groupEntry = raspCache.groups.timetable[group];
        const dayIndex = strDateToIndex(day.day);
        if (groupEntry.lastNoticedDay && dayIndex <= groupEntry.lastNoticedDay) {
            return;
        }

        groupEntry.lastNoticedDay = dayIndex;

        for (const service of this.serviceList) {
            await service.sendGroupDay(data);
        }

        await saveCache();
    }

    public static async updateGroupDay(data: { day: GroupDay, group: string }) {
        for (const service of this.serviceList) {
            await service.updateGroupDay(data);
        }
    }

    public static async nextTeacherDay(data: { index: number }) {
        for (const service of this.serviceList) {
            await service.nextTeacherDay(data);
        }
    }

    public static async sendTeacherDay(data: { day: TeacherDay, teacher: string }) {
        const { day, teacher } = data;

        const teacherEntry = raspCache.teachers.timetable[teacher];
        const dayIndex = strDateToIndex(day.day);
        if (teacherEntry.lastNoticedDay && dayIndex <= teacherEntry.lastNoticedDay) {
            return;
        }

        teacherEntry.lastNoticedDay = dayIndex;

        for (const service of this.serviceList) {
            await service.sendTeacherDay(data);
        }

        await saveCache();
    }

    public static async updateTeacherDay(data: { day: TeacherDay, teacher: string }) {
        for (const service of this.serviceList) {
            await service.updateTeacherDay(data);
        }
    }

    public static async sendNextWeek(chatMode: ChatMode) {
        for (const service of this.serviceList) {
            await service.sendNextWeek(chatMode);
        }
    }

    public static async sendDistibution(message: string, cb?: ServiceProgressCallback) {
        for (const service of this.serviceList) {
            await service.sendDistribution(message, cb ? (data) => {
                cb(Object.assign({ service: service.service }, data))
            } : undefined);
        }
    }

    public static async sendError(error: Error) {
        for (const service of this.serviceList) {
            await service.sendError(error);
        }
    }

    public static deferFunction(id: string, func: () => any) {
        if (this.deferred[id]) return;

        this.deferred[id] = func;
    }

    private static async runDeferredFunctions() {
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
