import { AbstractEventListener } from ".";
import { ChatMode } from "../../services/bots/abstract";
import { GroupDay, TeacherDay } from "../parser/types";

export class EventController {
    protected static serviceList: AbstractEventListener[] = [];

    public static registerService(service: AbstractEventListener) {
        this.serviceList.push(service);
    }

    public static async nextGroupDay(data: { index: number }) {
        for (const service of this.serviceList) {
            await service.nextGroupDay(data);
        }
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

    public static async sendDistibution(message: string) {
        for (const service of this.serviceList) {
            await service.sendDistribution(message);
        }
    }

    public static async sendError(error: Error) {
        for (const service of this.serviceList) {
            await service.sendError(error);
        }
    }
}
