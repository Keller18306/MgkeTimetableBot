import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../parser";
import { getDayRasp, randArray } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
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

        let initiator: InputInitiator;
        let group: string | number | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable));

            group = await context.input(`Введите номер группы, которой хотите узнать расписание на день (например, ${randGroup})`, {
                keyboard: withCancelButton(keyboard.GroupHistory)
            }).then<string | undefined>(value => {
                initiator = value?.initiator;

                return value?.text;
            });
        }

        while (true) {
            group = await this.findGroup(context, keyboard, group, keyboard.MainMenu);

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
        });

        const options: MessageOptions = {
            keyboard: keyboard.GetWeekTimetable('group', group)
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }
}