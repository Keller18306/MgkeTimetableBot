import { TelegramBotCommand } from "puregram/generated";
import { StringDate, prepareError } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";
import { AppServiceName } from "../../../../app";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(get)?(updater|parser)Logs/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'parserLogs',
        description: 'Логи последних обновлений парсера'
    };

    public adminOnly: boolean = true;
    public requireServices: AppServiceName[] = ['parser'];

    handler({ context }: CmdHandlerParams) {
        let logs = this.app.getService('parser').getLogs();
        if (logs.length == 0) {
            return context.send('Логов нет');
        }

        const message: string[] = [];

        for (const i in logs) {
            const log = logs[i]
            message.push(
                `${+i + 1}. [${StringDate.fromDate(log.date).toStringDateTime(true)}]: ` +
                ((log.result instanceof Error) ? prepareError(log.result) : log.result)
            )
        }

        return context.send(message.join('\n').slice(0, 4096), {
            disableHtmlParser: true
        });
    }
}