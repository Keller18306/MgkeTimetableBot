import db from "../../../db";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppSetConfigMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'setConfig';

    handler({ user, request, response }: HandlerParams) {
        const cfg = user.get();

        const body = request.body;
        const group = body.group;
        const teacher = body.teacher;
        const firstPage = body.firstPage;
        const theme_id = body.theme_id;

        if ((typeof group !== 'number' && typeof group !== 'string') && group !== null) return false;
        if (typeof teacher !== 'string' && teacher !== null) return false;
        if (typeof firstPage !== 'string' && firstPage !== null) return false;
        if (typeof theme_id !== 'number') return false;

        if (teacher !== null && String(group).length > 255) return false;
        if (teacher !== null && String(teacher).length > 255) return false;
        if (theme_id > 3) return false;
        if (firstPage !== null && String(firstPage).length > 16) return false;

        db.prepare([
            'UPDATE `vk_app_users` SET',
            '`group` = ?,',
            '`teacher` = ?,',
            '`theme_id` = ?,',
            '`firstPage` = ?',
            'WHERE `id` = ?'
        ].join(' ')).run(group, teacher, theme_id, firstPage, cfg.id);

        return true;
    }
}