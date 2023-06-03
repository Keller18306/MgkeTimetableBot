import { TelegramBotCommand } from "puregram/generated";
import { Updater } from "../../../../updater";
import { formatTime } from "../../../../utils/time";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'updater_logs'

    public regexp = /^(!|\/)(get)?updaterLogs/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'updaterLogs',
        description: 'Логи последних обновлений парсера'
    };

    public adminOnly: boolean = true;

    handler({ context }: HandlerParams) {
        let logs = Updater.getInstance().getLogs()

        if (logs.length == 0) return context.send('Логов нет')

        logs = logs.reverse()
        const message: string[] = []

        for (const i in logs) {
            const log = logs[i]
            message.push(
                `${+i + 1}. [${formatTime(log.date, true)}]: ` +
                ((log.result instanceof Error) ? log.result.stack?.replaceAll(process.cwd(), '') : log.result)
            )
        }

        return context.send(message.join('\n').slice(0, 4096))
    }
}