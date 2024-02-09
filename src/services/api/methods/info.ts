import { raspCache } from "../../parser";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'info';

    handler({ request, response }: HandlerParams) {
        return {
            groups: {
                update: raspCache.groups.update,
                changed: raspCache.groups.changed,
                lastWeekIndex: raspCache.groups.lastWeekIndex,
                hash: raspCache.groups.hash
            },
            teachers: {
                update: raspCache.teachers.update,
                changed: raspCache.teachers.changed,
                lastWeekIndex: raspCache.teachers.lastWeekIndex,
                hash: raspCache.teachers.hash
            },
            team: {
                update: raspCache.team.update,
                changed: raspCache.team.changed,
                hash: raspCache.team.hash
            },
            lastSuccess: raspCache.successUpdate
        }
    }
}