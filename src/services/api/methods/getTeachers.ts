import { Updater } from "../../../updater";
import { sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

const archive = Updater.getInstance().archive;

export default class extends VKAppDefaultMethod {
    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'getTeachers';

    handler({ request, response }: HandlerParams) {
        return sort(archive.getTeachers());
    }
}