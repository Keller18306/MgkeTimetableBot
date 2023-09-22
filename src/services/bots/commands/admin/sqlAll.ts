import { TelegramBotCommand } from "puregram/generated";
import db from "../../../../db";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(sql|db)_?all/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'sql_all',
        description: 'Выполнить SQL запрос с вывести все (много) результаты'
    };

    public adminOnly: boolean = true;

    handler({ context }: CmdHandlerParams) {
        const sql = context.text?.replace(this.regexp, '').trim()
        if (sql === undefined) return;

        const res = db.prepare(sql).all()
        context.send(JSON.stringify(res, null, 1))
    }
}