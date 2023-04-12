import StatusCode from "status-code-enum";
import { raspCache } from "../../../updater";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'getGroup';

    handler({ request, response }: HandlerParams) {
        const body = request.body

        if (body.group == null) {
            response.status(StatusCode.ClientErrorBadRequest).send({
                error: 'Не указана группа'
            })

            return 
        }

        const group = Number(body.group)
        if (isNaN(group)) {
            response.status(StatusCode.ClientErrorBadRequest).send({
                error: 'Группа указана некорректно'
            })

            return 
        }

        return {
            days: raspCache.groups.timetable[group]?.days || null,
            update: raspCache.groups.update,
            lastSuccess: raspCache.successUpdate
        }
    }
}