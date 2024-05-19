import { AppServiceName } from "../../../../app";
import { AbstractCommand, BotServiceName, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)acceptMe($|\s)/i
    public payloadAction = null;

    public services: BotServiceName[] = ['vk'];
    public requireServices: AppServiceName[] = ['vk', 'vkApp'];

    handler({ context }: CmdHandlerParams) {
        return context.send('Больше недоступно!')
    }
}