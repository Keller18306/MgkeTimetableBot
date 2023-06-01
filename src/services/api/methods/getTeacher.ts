import StatusCode from "status-code-enum";
import { raspCache } from "../../../updater";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'getTeacher';

    handler({ request, response }: HandlerParams) {
        const body = request.body

        if (body.teacher == null) {
            response.status(StatusCode.ClientErrorBadRequest).send({
                error: 'Не указан преподаватель'
            })

            return 
        }

        const teacher = body.teacher

        return {
            days: raspCache.teachers.timetable[teacher]?.days || null,
            update: raspCache.teachers.update,
            lastSuccess: raspCache.successUpdate
        }
    }
}