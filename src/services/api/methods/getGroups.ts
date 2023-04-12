import { raspCache } from "../../../updater";
import { sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'getGroups';

    handler({ request, response }: HandlerParams) {
        return sort(Object.keys(raspCache.groups.timetable))
    }
}