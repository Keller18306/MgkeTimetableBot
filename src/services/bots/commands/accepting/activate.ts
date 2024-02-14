import { AppServiceName } from "../../../../app";
import { AbstractCommand, BotServiceName as BotService, CmdHandlerParams } from "../../abstract";

//const activateTool = new ActivateKey(config.encrypt_key)

export default class extends AbstractCommand {
    public regexp = /^(!|\/)activate/i
    public payload = null;

    public services: BotService[] = ['vk'];
    public requireServices: AppServiceName[] = ['vk', 'vkApp'];

    handler({ context }: CmdHandlerParams) {
        /*let id: string | undefined | number = context.text?.replace(this.regexp, '').trim()
        if (id === undefined || id === '') id = context.peerId
        
        if (isNaN(+id)) return context.send('это не число')
        
        db.prepare('UPDATE `vk_bot_chats` SET `accepted` = 1 WHERE `peerId` = ?').run(id)

        return context.send(`ok ${id}`)*/
    }
}