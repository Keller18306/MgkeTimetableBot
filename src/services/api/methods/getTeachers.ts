import { sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'getTeachers';

    async handler({ app }: HandlerParams) {
        const teachers = await app.getService('timetable').getTeachers();

        return sort(teachers);
    }
}