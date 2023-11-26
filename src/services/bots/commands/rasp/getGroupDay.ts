import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { getDayRasp, randArray } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";
import { withCancelButton } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(getDayByGroup|getGroupDay|(get)?group))|((👩‍🎓\s)?Группа(\s?День)?))(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'group',
        description: 'Узнать расписание на день указанной группы (не зависит от текущего вашего)'
    };
    public scene?: string | null = null;

    async handler({ context, chat, keyboard, scheduleFormatter }: CmdHandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let group: string | number | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable))

            group = await context.input(`Введите номер группы, которой хотите узнать расписание на день (например, ${randGroup})`, {
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
        const groupRasp = raspCache.groups.timetable[group];
        const message = scheduleFormatter.formatGroupFull(String(group), {
            showHeader: true,
            days: getDayRasp(groupRasp.days, true, 2)
        })

        return context.send(message, {
            keyboard: keyboard.GetWeekTimetable('group', group)
        });
    }
}