import { AbstractEventListener } from ".";
import { GroupDay, TeacherDay } from "../parser/types";

export class EventController {
    protected static serviceList: AbstractEventListener[] = [];

    public static registerEvent(event: AbstractEventListener) {
        this.serviceList.push(event);
    }

    public static async nextGroupDay(data: { index: number }) {
        for (const event of this.serviceList) {
            await event.nextGroupDay(data);
        }
    }

    public static async updateGroupDay(data: { day: GroupDay, group: string }) {
        for (const event of this.serviceList) {
            await event.updateGroupDay(data);
        }
    }

    public static async nextTeacherDay(data: { index: number }) {
        for (const event of this.serviceList) {
            await event.nextTeacherDay(data);
        }
    }

    public static async updateTeacherDay(data: { day: TeacherDay, teacher: string }) {
        for (const event of this.serviceList) {
            await event.updateTeacherDay(data);
        }
    }

    public static async sendDistibution(message: string) {
        for (const event of this.serviceList) {
            await event.sendDistribution(message);
        }
    }
}
