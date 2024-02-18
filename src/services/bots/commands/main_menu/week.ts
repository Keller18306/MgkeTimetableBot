import { TelegramBotCommand } from 'puregram/generated';
import { WeekIndex, randArray, removePastDays } from "../../../../utils";
import { raspCache } from '../../../parser';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)(get)?(rasp)?week|(📑\s)?(расписание\s)?на неделю)$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'week',
        description: 'Ваше расписание на неделю'
    };

    async handler(params: CmdHandlerParams) {
        const { context, chat, actions, scheduleFormatter, keyboard } = params;

        if (Object.keys(raspCache.groups.timetable).length == 0 &&
            Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        if (chat.mode == 'student' || chat.mode == 'parent') return this.groupRasp(params);
        if (chat.mode == 'teacher') return this.teacherRasp(params);

        return context.send('Первоначальная настройка ещё не была произведена');
    }

    private async groupRasp({ context, chat, actions, scheduleFormatter, keyboard }: CmdHandlerParams) {
        if (chat.group == null) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable));

            return context.send(
                'Ваша учебная группа не выбрана\n\n' +
                'Выбрать группу можно командой /setGroup <group>\n' +
                'Пример:\n' +
                `/setGroup ${randGroup}`
            );
        }

        const group = raspCache.groups.timetable[chat.group];
        if (group === undefined) return context.send('Данной учебной группы не существует');

        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();

        let days = this.app.getService('timetable').getGroupDaysByRange(weekRange, chat.group);
        if (chat.hidePastDays) {
            days = removePastDays(days);
        }

        actions.deleteLastMsg();

        const message = scheduleFormatter.formatGroupFull(String(chat.group), {
            showHeader: false,
            days: days
        });

        actions.deleteUserMsg();

        return context.send(message, {
            keyboard: keyboard.WeekControl('group', String(chat.group), weekIndex.valueOf(), chat.hidePastDays)
        }).then(id => {
            actions.handlerLastMsgUpdate(context);
            return id;
        });
    }

    private async teacherRasp({ context, chat, actions, scheduleFormatter, keyboard }: CmdHandlerParams) {
        if (chat.teacher == null) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

            return context.send(
                'Имя преподавателя не выбрано\n\n' +
                'Выбрать преподавателя можно командой /setTeacher <teacher>\n' +
                'Пример:\n' +
                `/setTeacher ${randTeacher}`
            );
        }

        const teacher = raspCache.teachers.timetable[chat.teacher];
        if (teacher === undefined) return context.send('Данного преподавателя не существует');

        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();

        let days = this.app.getService('timetable').getTeacherDaysByRange(weekRange, chat.teacher);
        if (chat.hidePastDays) {
            days = removePastDays(days);
        }

        actions.deleteLastMsg();

        const message = scheduleFormatter.formatTeacherFull(chat.teacher, {
            showHeader: false,
            days: days
        });

        actions.deleteUserMsg();

        return context.send(message, {
            keyboard: keyboard.WeekControl('teacher', chat.teacher, weekIndex.valueOf(), chat.hidePastDays)
        }).then(context => actions.handlerLastMsgUpdate(context));
    }
}