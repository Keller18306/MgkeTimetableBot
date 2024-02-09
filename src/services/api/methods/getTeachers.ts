import { sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'getTeachers';

    handler({ app }: HandlerParams) {
        const archive = app.getService('timetable');

        return sort(archive.getTeachers());
    }
}