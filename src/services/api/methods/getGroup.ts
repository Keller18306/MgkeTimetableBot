import { z } from "zod";
import { StringDate, getParams } from "../../../utils";
import { raspCache } from "../../parser";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'getGroup';

    handler({ request, response }: HandlerParams) {
        const { group } = z.object({
            group: z.union([
                z.string({
                    required_error: 'Не указана группа'
                }),
                z.number({
                    required_error: 'Не указана группа'
                }).int().pipe(z.coerce.string())
            ])
        }).parse(getParams(request));

        const days = raspCache.groups.timetable[group]?.days.map(day => {
            return Object.assign({}, {
                weekday: StringDate.fromStringDate(day.day).getWeekdayName()
            }, day);
        }) || null;

        return {
            days: days,
            update: raspCache.groups.update,
            changed: raspCache.groups.changed,
            lastSuccess: raspCache.successUpdate
        }
    }
}