import { TelegramBotCommand } from "puregram/generated";
import { Updater, raspCache } from "../../../../updater";
import { formatSeconds, sort } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

const archive = Updater.getInstance().archive;

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(get)?teachers$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teachers',
        description: 'Получить полный список преподавателей в кэше бота'
    };

    async handler({ context }: CmdHandlerParams) {
        const teachers = sort(archive.getTeachers()).map((value, i) => {
            return `${i + 1}. ${value}`
        });

        context.send([
            '__ Преподаватели в кэше __\n',
            teachers.join('\n'),
            `\nЗагружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.teachers.update) / 1e3))} назад\n`,
            `Изменено: ${formatSeconds(Math.ceil((Date.now() - raspCache.teachers.changed) / 1e3))} назад`
        ].join('\n'))
    }
}