import { TelegramBotCommand } from "puregram/generated";
import db from "../../../../db";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'sql_run'

    public regexp = /^(!|\/)(sql|db)_?run/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'sql_run',
        description: 'Выполнить SQL запрос без вывода результата (только кол-во затронутых строк)'
    };

    public adminOnly: boolean = true;

    handler({ context }: HandlerParams) {
        const sql = context.text?.replace(this.regexp, '').trim()
        if (sql === undefined) return;

        const res = db.prepare(sql).run()
        context.send(JSON.stringify(res, null, 1))
    }
}