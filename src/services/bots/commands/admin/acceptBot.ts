import db from "../../../../db";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'acceptBot'

    public regexp = /^(!|\/)acceptBot($|\s)/i
    public payload = null;

    public adminOnly: boolean = true;

    handler({ context, chat }: HandlerParams) {
        let id: string | undefined | number = context.text?.replace(this.regexp, '').trim()
        if (id == undefined || id === '') id = context.peerId

        if (isNaN(+id)) return context.send('это не число')

        db.prepare('UPDATE `' + chat.db_table + '` SET `accepted` = 1 WHERE `peerId` = ?').run(id)

        return context.send(`ok ${id}`)
    }
}