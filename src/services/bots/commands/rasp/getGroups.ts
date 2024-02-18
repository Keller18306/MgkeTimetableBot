import { TelegramBotCommand } from "puregram/generated";
import { formatSeconds } from "../../../../utils";
import { raspCache } from "../../../parser";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(get)?groups$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'groups',
        description: 'Получить полный список групп в кэше бота'
    };

    async handler({ context }: CmdHandlerParams) {
        const archive = this.app.getService('timetable');

        return context.send([
            '__ Группы в кэше __\n',
            archive.getGroups().join(', '),

            `\nЗагружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.groups.update) / 1e3))} назад`,
            `Изменено: ${formatSeconds(Math.ceil((Date.now() - raspCache.groups.changed) / 1e3))} назад`
        ].join('\n'));
    }
}