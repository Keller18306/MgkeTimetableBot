import { TelegramBotCommand } from "puregram/generated";
import { Updater, raspCache } from "../../../../updater";
import { getCurrentWeekIndexToShow, getDayIndex, randArray, weekBoundsByWeekIndex } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { withCancelButton } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(getWeekByGroup|(get)?GroupWeek))|(Группа\s?Неделя))/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'groupweek',
        description: 'Узнать расписание на неделю указанной группы (не зависит от текущего вашего)'
    };

    async handler({ context, chat, keyboard, scheduleFormatter }: CmdHandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let initiator: InputInitiator;
        let group: string | number | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable));

            group = await context.input(`Введите номер группы, которой хотите узнать расписание на неделю (например, ${randGroup})`, {
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

        const currentWeekIndex = getCurrentWeekIndexToShow();
        const weekBounds = weekBoundsByWeekIndex(currentWeekIndex).map(getDayIndex) as [number, number];
        const days = Updater.getInstance().archive.getGroupDaysByBounds(weekBounds, group);

        const message = scheduleFormatter.formatGroupFull(String(group), {
            showHeader: true,
            days: days
        });

        const options: MessageOptions = {
            keyboard: keyboard.WeekControl('group', group, currentWeekIndex, false)
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }
}