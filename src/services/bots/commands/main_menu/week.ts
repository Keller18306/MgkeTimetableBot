import { TelegramBotCommand } from 'puregram/generated';
import { raspCache } from '../../../../updater';
import { GroupDay, TeacherDay } from '../../../../updater/parser/types';
import { removePastDays } from "../../../../utils/buildTextRasp";
import { ScheduleFormatter } from '../../../../utils/formatters/abstract';
import { randArray } from "../../../../utils/rand";
import { AbstractAction } from "../../abstract/action";
import { AbstractChat } from "../../abstract/chat";
import { AbstractCommandContext, DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_raspweek'

    public regexp = /^((!|\/)(get)?(rasp)?week|(📑\s)?(расписание\s)?на неделю)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'week',
        description: 'Ваше расписание на неделю'
    };

    async handler({ context, chat, actions, scheduleFormatter }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0 &&
            Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        if (chat.mode == 'student' || chat.mode == 'parent') return this.groupRasp(context, chat, actions, scheduleFormatter);
        if (chat.mode == 'teacher') return this.teacherRasp(context, chat, actions, scheduleFormatter);

        return context.send('Первоначальная настройка ещё не была произведена');
    }

    private async groupRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction, scheduleFormatter: ScheduleFormatter) {
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

        let days: GroupDay[] = group.days;
        if (chat.removePastDays) {
            days = removePastDays(days);
        }

        actions.deleteLastMsg();

        const message = scheduleFormatter.formatGroupFull(String(chat.group), {
            showHeader: false,
            days: days
        })
        //const image = await ImageBuilder.getGroupImage(group);

        actions.deleteUserMsg();

        const id = await context.send(message).then(id => {
            actions.handlerLastMsgUpdate(context)
            return id;
        });

        //return context.sendPhoto(image, { reply_to: id })
    }

    private async teacherRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction, scheduleFormatter: ScheduleFormatter) {
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

        let days: TeacherDay[] = teacher.days;
        if (chat.removePastDays) {
            days = removePastDays(days);
        }

        actions.deleteLastMsg();

        const message = scheduleFormatter.formatTeacherFull(chat.teacher, {
            showHeader: false,
            days: days
        })

        actions.deleteUserMsg();

        return context.send(message).then(context => actions.handlerLastMsgUpdate(context));
    }
}