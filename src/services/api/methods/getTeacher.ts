import { z } from "zod";
import { StringDate, getParams } from "../../../utils";
import { raspCache } from "../../parser";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'getTeacher';

    handler({ request, response }: HandlerParams) {
        const { teacher } = z.object({
            teacher: z.string({
                required_error: 'Не указан преподаватель'
            })
        }).parse(getParams(request));

        const days = raspCache.teachers.timetable[teacher]?.days.map(day => {
            return Object.assign({}, {
                weekday: StringDate.fromStringDate(day.day).getWeekdayName()
            }, day);
        }) || null;

        return {
            days: days,
            update: raspCache.teachers.update,
            changed: raspCache.teachers.changed,
            lastSuccess: raspCache.successUpdate
        }
    }
}