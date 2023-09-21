import { AbstractEventListener } from ".";
import { ChatMode } from "../../services/bots/abstract";
import { GroupDay, TeacherDay } from "../parser/types";

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
        for (const service of this.serviceList) {
            await service.sendGroupDay(data);
        }

        await this.runDeferredFunctions();
    }

    public static async updateGroupDay(data: { day: GroupDay, group: string }) {
        for (const service of this.serviceList) {
            await service.updateGroupDay(data);
        }

        await this.runDeferredFunctions();
    }

    public static async nextTeacherDay(data: { index: number }) {
        for (const service of this.serviceList) {
            await service.nextTeacherDay(data);
        }

        await this.runDeferredFunctions();
    }

    public static async sendTeacherDay(data: { day: TeacherDay, teacher: string }) {
        for (const service of this.serviceList) {
            await service.sendTeacherDay(data);
        }
    }

    public static async updateTeacherDay(data: { day: TeacherDay, teacher: string }) {
        for (const service of this.serviceList) {
            await service.updateTeacherDay(data);
        }

        await this.runDeferredFunctions();
    }

    public static async sendNextWeek(chatMode: ChatMode) {
        for (const service of this.serviceList) {
            await service.sendNextWeek(chatMode);
        }

        await this.runDeferredFunctions();
    }

    public static async sendDistibution(message: string) {
        for (const service of this.serviceList) {
            await service.sendDistribution(message);
        }

        await this.runDeferredFunctions();
    }

    public static async sendError(error: Error) {
        for (const service of this.serviceList) {
            await service.sendError(error);
        }

        await this.runDeferredFunctions();
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
