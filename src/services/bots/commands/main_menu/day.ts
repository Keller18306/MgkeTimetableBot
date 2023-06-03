import { TelegramBotCommand } from 'puregram/generated';
import { raspCache } from '../../../../updater';
import { getDayRasp } from "../../../../utils/buildTextRasp";
import { ScheduleFormatter } from '../../../../utils/formatters/abstract';
import { randArray } from "../../../../utils/rand";
import { AbstractAction, AbstractChat, AbstractCommandContext, DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'get_raspday'

    public regexp = /^((!|\/)(get)?(rasp)?day|(📄\s)?(расписание\s)?на день)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'day',
        description: 'Ваше расписание на день'
    };

    async handler({ context, chat, actions, scheduleFormatter }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0 && Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        if (chat.mode == 'student' || chat.mode == 'parent') return this.groupRasp(context, chat, actions, scheduleFormatter);
        if (chat.mode == 'teacher') return this.teacherRasp(context, chat, actions, scheduleFormatter);

        return context.send('Первоначальная настройка ещё не была произведена')
    }

    private async groupRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction, scheduleFormatter: ScheduleFormatter) {
        if (chat.group == null) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable))

            return context.send(
                'Ваша учебная группа не выбрана\n\n' +
                'Выбрать группу можно командой /setGroup <group>\n' +
                'Пример:\n' +
                `/setGroup ${randGroup}`
            )
        }

        const rasp = raspCache.groups.timetable[chat.group]
        if (rasp === undefined) return context.send('Данной учебной группы не существует');

        actions.deleteLastMsg()

        const message = scheduleFormatter.formatGroupFull(String(chat.group), {
            days: getDayRasp(rasp.days)
        })

        actions.deleteUserMsg()

        return context.send(message).then(context => actions.handlerLastMsgUpdate(context))
    }

    private async teacherRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction, scheduleFormatter: ScheduleFormatter) {
        if (chat.teacher == null) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

            return context.send(
                'Имя преподавателя не выбрано\n\n' +
                'Выбрать преподвателя можно командой /setTeacher <teacher>\n' +
                'Пример:\n' +
                `/setTeacher ${randTeacher}`
            )
        }

        if (Object.keys(raspCache.teachers.timetable).length == 0) return context.send('Данные с сервера ещё не загружены, ожидайте...')

        const rasp = raspCache.teachers.timetable[chat.teacher]
        if (rasp === undefined) return context.send('Ничего не найдено');

        actions.deleteLastMsg()

        const message = scheduleFormatter.formatTeacherFull(chat.teacher, {
            days: getDayRasp(rasp.days)
        })

        actions.deleteUserMsg()

        context.send(message).then(context => actions.handlerLastMsgUpdate(context))
    }
}