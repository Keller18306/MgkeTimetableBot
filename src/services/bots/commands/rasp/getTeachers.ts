import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { sort } from "../../../../utils";
import { formatSeconds } from "../../../../utils/seconds2times";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_teachers'

    public regexp = /^(!|\/)(get)?teachers$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teachers',
        description: 'Получить полный список преподавателей в кэше бота'
    };

    async handler({ context, chat }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...')
        }

        const teachers = sort(Object.keys(raspCache.teachers.timetable)).map((value, i) => {
            return `${i+1}. ${value}`
        })

        context.send([
            '__ Преподаватели в кэше __\n',
            teachers.join('\n'),
            `\nЗагружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.teachers.update) / 1e3))} назад\n`
        ].join('\n'))
    }
}