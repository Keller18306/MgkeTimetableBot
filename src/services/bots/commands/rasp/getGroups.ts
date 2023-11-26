import { TelegramBotCommand } from "puregram/generated";
import { Updater, raspCache } from "../../../../updater";
import { formatSeconds } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

const archive = Updater.getInstance().archive;

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(get)?groups$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'groups',
        description: 'Получить полный список групп в кэше бота'
    };

    async handler({ context }: CmdHandlerParams) {
        return context.send([
            '__ Группы в кэше __\n',
            archive.getGroups().join(', '),

            `\nЗагружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.groups.update) / 1e3))} назад`,
            `Изменено: ${formatSeconds(Math.ceil((Date.now() - raspCache.groups.changed) / 1e3))} назад`
        ].join('\n'))
    }
}