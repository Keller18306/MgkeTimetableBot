import { z } from "zod";
import db from "../../../db";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppSetConfigMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'setConfig';

    handler({ user, request, response }: HandlerParams) {
        const cfg = user.get();

        const result = z.object({
            group: z.string().max(255).nullable(),
            teacher: z.string().max(255).nullable(),
            firstPage: z.string().max(16).nullable(),
            theme_id: z.number().max(3).int()
        }).safeParse(request.body);

        if (!result.success) {
            return false;
        }

        const {
            group, teacher, theme_id, firstPage
        } = result.data;

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