import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { withCancelButton } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(getWeekByGroup|(get)?GroupWeek))|(Группа\s?Неделя))/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'groupweek',
        description: 'Узнать расписание на неделю указанной группы (не зависит от текущего вашего)'
    };

    async handler({ context, chat, keyboard, scheduleFormatter }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...')
        }

        let group: string | number | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable))

            group = await context.input(`Введите номер группы, которой хотите узнать расписание на неделю (например, ${randGroup})`, {
                keyboard: withCancelButton(keyboard.GroupHistory)
            });
        }

        while (true) {
            group = await this.findGroup(context, keyboard, group, keyboard.MainMenu)

            if (!group) {
                return;
            }

            break;
        }

        chat.appendGroupSearchHistory(String(group));
        const message = scheduleFormatter.formatGroupFull(String(group), {
            showHeader: true
        })

        return context.send(message, {
            keyboard: keyboard.GenerateImage('group', String(group))
        })
    }
}