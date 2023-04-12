import db from "../../../db";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppSetConfigMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'setConfig';

    handler({ user, request, response }: HandlerParams) {
        const cfg = user.get();

        if (
            typeof request.body.group !== 'number' &&
            request.body.group !== null
        ) return false;
        if (
            typeof request.body.teacher !== 'string' &&
            request.body.teacher !== null
        ) return false;
        if (
            typeof request.body.firstPage !== 'string' &&
            request.body.firstPage !== null
        ) return false;
        if (typeof request.body.theme_id !== 'number') return false;

        if (
            request.body.teacher !== null &&
            String(request.body.group).length > 3) return false;
        if (
            request.body.teacher !== null &&
            request.body.teacher.length > 255
        ) return false;
        if (request.body.theme_id > 3) return false;
        if (
            request.body.firstPage !== null &&
            request.body.firstPage.length > 16
        ) return false;


        db.prepare([
            'UPDATE `vk_app_users` SET',
            '`group` = ?,',
            '`teacher` = ?,',
            '`theme_id` = ?,',
            '`firstPage` = ?',
            'WHERE `id` = ?'
        ].join(' ')).run(
            request.body.group,
            request.body.teacher,
            request.body.theme_id,
            request.body.firstPage,
            cfg.id
        )

        return true;
    }
}