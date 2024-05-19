import { AppServiceName } from "../../../../app";
import { VKAppUser } from "../../../vk_app/user";
import { AbstractCommand, BotServiceName, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)acceptApp($|\s)/i
    public payloadAction = null;

    public adminOnly: boolean = true;

    public services: BotServiceName[] = ['vk'];
    public requireServices: AppServiceName[] = ['vk', 'vkApp'];

    async handler({ context }: CmdHandlerParams) {
        let id: string | undefined | number = context.text?.replace(this.regexp, '').trim();
        if (id == undefined || id === '') {
            return context.send('id не введен');
        }

        if (isNaN(+id)) {
            return context.send('это не число');
        }

        await VKAppUser.update({
            accepted: true
        }, {
            where: { userId: id },
        });

        return context.send(`ok ${id}`);
    }
}