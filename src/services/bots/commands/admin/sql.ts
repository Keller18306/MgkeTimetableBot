import { TelegramBotCommand } from "puregram/generated";
import { QueryTypes } from "sequelize";
import { App } from "../../../../app";
import { sequelize } from "../../../../db";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(sql|db)(_?run)?/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'sql',
        description: this.getDescription()
    };

    public adminOnly: boolean = true;

    constructor(app: App) {
        super(app);

        const dialect = sequelize.getDialect();
        this.tgCommand.description = this.getDescription(dialect);
    }

    private getDescription(dialect?: string) {
        return `Выполнить SQL${dialect ? ` (${dialect})` : ''} запрос`;
    }

    public async handler({ context }: CmdHandlerParams) {
        const sql = context.text?.replace(this.regexp, '').trim()
        if (sql === undefined) return;

        const [results] = await sequelize.query(sql, {
            type: QueryTypes.RAW,
            raw: true,
            plain: false
        });

        return context.send(JSON.stringify(results, null, 1).slice(0, 4096));
    }
}