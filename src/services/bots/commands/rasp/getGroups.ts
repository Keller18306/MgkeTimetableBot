import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { formatSeconds } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'get_groups'

    public regexp = /^(!|\/)(get)?groups$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'groups',
        description: 'Получить полный список групп в кэше бота'
    };

    async handler({ context }: HandlerParams) {
        if (
            Object.keys(raspCache.groups.timetable).length == 0
        ) return context.send('Данные с сервера ещё не загружены, ожидайте...')

        return context.send([
            '__ Группы в кэше __\n',
            Object.keys(raspCache.groups.timetable).join(', '),

            `\nЗагружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.groups.update) / 1e3))} назад`
        ].join('\n'))
    }
}