import { TelegramBotCommand } from "puregram/generated";
import { WeekIndex, getDayRasp, randArray } from "../../../../utils";
import { ImageFile } from "../../../image/builder";
import { raspCache } from "../../../parser";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { StaticKeyboard, withCancelButton } from "../../keyboard";

export default class GetGroupCommand extends AbstractCommand {
    public regexp = {
        day: /^(((!|\/)(getDayByGroup|getGroupDay|(get)?group))|((👩‍🎓\s)?Группа(\s?День)?))(\b|$|\s)/i,
        week: /^(((!|\/)(getWeekByGroup|(get)?GroupWeek))|(Группа\s?Неделя))/i,
        image: /^(((!|\/)(get)?(groupImage|imageGroup))|(Группа(фото(графия)?|таблица)))(\b|$|\s)/i
    };
    public payloadAction = null;
    public scene?: string | null = null;
    public tgCommand: TelegramBotCommand[] = [
        {
            command: 'group',
            description: 'Узнать расписание на день указанной группы (не зависит от текущего вашего)'
        },
        {
            command: 'groupweek',
            description: 'Узнать расписание на неделю указанной группы (не зависит от текущего вашего)'
        },
        {
            command: 'groupimage',
            description: 'Сгенерировать фотографию расписания группы (не зависит от текущего вашего)'
        }
    ];

    async handler(params: CmdHandlerParams<GetGroupCommand>) {
        const { context, chat, keyboard, regexp } = params;

        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let initiator: InputInitiator;
        let group: string | false | undefined = context.text?.replace(this.getRegExp(params), '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable));

            group = await context.input(`Введите номер группы, которой хотите узнать расписание (например, ${randGroup})`, {
                keyboard: withCancelButton(keyboard.GroupHistory)
            }).then<string | undefined>(value => {
                initiator = value?.initiator;

                return value?.text;
            });
        }

        while (true) {
            group = await this.findGroup(params, group, keyboard.MainMenu);

            if (!group) {
                return;
            }

            break;
        }

        chat.appendGroupHistory(group);

        if (regexp === 'day') {
            return this.sendDay(group, initiator, params);
        }

        if (regexp === 'week') {
            return this.sendWeek(group, initiator, params);
        }

        if (regexp === 'image') {
            return this.sendImage(group, initiator, params);
        }

        throw new Error('unknown error');
    }

    private async sendDay(group: string, initiator: InputInitiator, { context, formatter }: CmdHandlerParams) {
        const groupRasp = raspCache.groups.timetable[group];
        const message = formatter.formatGroupFull(String(group), {
            showHeader: true,
            days: getDayRasp(groupRasp.days, true, 2)
        });

        const options: MessageOptions = {
            keyboard: StaticKeyboard.GetWeekTimetable({ type: 'group', value: group })
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }

    private async sendWeek(group: string, initiator: InputInitiator, { context, keyboard, formatter }: CmdHandlerParams) {
        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();
        const days = await this.app.getService('timetable').getGroupDaysByRange(weekRange, group);

        const message = formatter.formatGroupFull(String(group), {
            showHeader: true,
            days: days
        });

        const options: MessageOptions = {
            keyboard: await keyboard.WeekControl('group', group, weekIndex.valueOf(), false)
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }

    private async sendImage(group: string, initiator: InputInitiator, { context }: CmdHandlerParams) {
        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();
        const days = await this.app.getService('timetable').getGroupDaysByRange(weekRange, group);

        const image: ImageFile = await this.app.getService('image').builder.getGroupImage(group, days);

        return context.sendPhoto(image);
    }

    private getRegExp({ regexp }: CmdHandlerParams<GetGroupCommand>): RegExp {
        if (!regexp) {
            throw new Error('regexp initiator not matched');
        }

        return this.regexp[regexp];
    }
}