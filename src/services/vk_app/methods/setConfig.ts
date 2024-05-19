import { z } from "zod";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppSetConfigMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'setConfig';

    async handler({ user, request, response }: HandlerParams) {
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

        await user.update({
            group: group,
            teacher: teacher,
            themeId: theme_id,
            firstPage: firstPage
        });

        return true;
    }
}