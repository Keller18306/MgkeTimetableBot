import StatusCode from "status-code-enum";
import { raspCache } from "../../../updater";
import { getWeekdayNameByStrDate } from "../../../utils";
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
                weekday: getWeekdayNameByStrDate(day.day)
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