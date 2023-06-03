import db from "../../../../db";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'acceptBot'

    public regexp = /^(!|\/)acceptBot($|\s)/i
    public payload = null;

    public adminOnly: boolean = true;

    handler({ context, chat, service }: HandlerParams) {
        let id: string | undefined | number = context.text?.replace(this.regexp, '').trim()
        if (id == undefined || id === '') id = context.peerId
        if (isNaN(+id)) return context.send('это не число');

        db.prepare(`UPDATE chat_options SET accepted = 1 WHERE service = ? AND id = (SELECT id FROM ${chat.db_table} WHERE peerId = ?)`).run(service, id);

        return context.send(`ok ${id}`)
    }
}