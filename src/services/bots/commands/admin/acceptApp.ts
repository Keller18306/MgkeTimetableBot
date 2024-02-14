import { AppServiceName } from "../../../../app";
import db from "../../../../db";
import { AbstractCommand, BotServiceName, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)acceptApp($|\s)/i
    public payload = null;

    public adminOnly: boolean = true;

    public services: BotServiceName[] = ['vk'];
    public requireServices: AppServiceName[] = ['vk', 'vkApp'];

    handler({ context }: CmdHandlerParams) {
        let id: string | undefined | number = context.text?.replace(this.regexp, '').trim()
        if (id == undefined || id === '') return context.send('id не введен')

        if (isNaN(+id)) return context.send('это не число')

        db.prepare('UPDATE `vk_app_users` SET `accepted` = 1 WHERE `user_id` = ?').run(id)

        return context.send(`ok ${id}`)
    }
}