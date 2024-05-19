import { sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'getGroups';

    async handler({ app }: HandlerParams) {
        const groups = await app.getService('timetable').getGroups();

        return sort(groups);
    }
}