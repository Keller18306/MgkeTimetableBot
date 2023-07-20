import { TelegramBotCommand } from "puregram/generated";
import db from "../../../../db";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(sql|db)_?get/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'sql_get',
        description: 'Выполнить SQL запрос с вывести один результат'
    };

    public adminOnly: boolean = true;

    handler({ context }: HandlerParams) {
        const sql = context.text?.replace(this.regexp, '').trim()
        if (sql === undefined) return;

        const res = db.prepare(sql).get()
        context.send(JSON.stringify(res, null, 1))
    }
}