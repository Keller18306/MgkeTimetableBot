import StatusCode from "status-code-enum";
import { StringDate } from "../../../utils";
import { raspCache } from "../../parser";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'getGroup';

    handler({ request, response }: HandlerParams) {
        const body = request.body

        if (body.group == null) {
            response.status(StatusCode.ClientErrorBadRequest).send({
                error: 'Не указана группа'
            });

            return;
        }

        const days = raspCache.groups.timetable[body.group]?.days.map(day => {
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