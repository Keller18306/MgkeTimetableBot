import { AbstractCommand, HandlerParams } from "../../abstract";

//const activateTool = new ActivateKey(config.encrypt_key)

export default class extends AbstractCommand {
    public id = 'activate'

    public regexp = /^(!|\/)activate/i
    public payload = null;

    handler({ context }: HandlerParams) {
        /*let id: string | undefined | number = context.text?.replace(this.regexp, '').trim()
        if (id === undefined || id === '') id = context.peerId
        
        if (isNaN(+id)) return context.send('это не число')
        
        db.prepare('UPDATE `vk_bot_chats` SET `accepted` = 1 WHERE `peerId` = ?').run(id)

        return context.send(`ok ${id}`)*/
    }
}