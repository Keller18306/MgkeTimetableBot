import StatusCode from "status-code-enum";
import { raspCache } from "../../../updater";
import { getWeekdayNameByStrDate } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'getTeacher';

    handler({ request, response }: HandlerParams) {
        const body = request.body

        if (body.teacher == null) {
            response.status(StatusCode.ClientErrorBadRequest).send({
                error: 'Не указан преподаватель'
            });

            return;
        }

        const days = raspCache.teachers.timetable[body.teacher]?.days.map(day => {
            return Object.assign({}, {
                weekday: getWeekdayNameByStrDate(day.day)
            }, day);
        }) || null;

        return {
            days: days,
            update: raspCache.teachers.update,
            lastSuccess: raspCache.successUpdate
        }
    }
}