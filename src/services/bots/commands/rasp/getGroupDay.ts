import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { getDayRasp } from "../../../../utils/buildTextRasp";
import { DefaultCommand, HandlerParams } from "../../abstract/command";
import { StaticKeyboard } from "../../keyboard";

export default class extends DefaultCommand {
    public id = 'get_day_by_group';

    public regexp = /^(((!|\/)(getDayByGroup|getGroupDay|(get)?group))|((👩‍🎓\s)?Группа(\s?День)?))(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'group',
        description: 'Узнать расписание на день указанной группы (не зависит от текущего вашего)'
    };
    public scene?: string | null = null;

    async handler({ context, keyboard, scheduleFormatter }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let group: string | number | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable))

            group = await context.input(`Введите номер группы, которой хотите узнать расписание на день (например, ${randGroup})`, {
                keyboard: StaticKeyboard.Cancel
            });
        }

        while (true) {
            group = await this.findGroup(context, group, keyboard.MainMenu)

            if (!group) {
                return;
            }

            break;
        }

        const groupRasp = raspCache.groups.timetable[group];
        const message = scheduleFormatter.formatGroupFull(String(group), {
            showHeader: true,
            days: getDayRasp(groupRasp.days)
        })

        return context.send(message);
    }
}