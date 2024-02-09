import { sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'getGroups';

    handler({ app }: HandlerParams) {
        const archive = app.getService('timetable');

        return sort(archive.getGroups())
    }
}