import { TelegramBotCommand } from 'puregram/generated';
import { raspCache } from '../../../../updater';
import { buildGroupTextRasp, buildTeacherTextRasp, getDayRasp } from "../../../../utils/buildTextRasp";
import { randArray } from "../../../../utils/rand";
import { AbstractAction } from "../../abstract/action";
import { AbstractChat } from "../../abstract/chat";
import { AbstractCommandContext, DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_raspday'

    public regexp = /^((!|\/)(get)?(rasp)?day|(📄\s)?(расписание\s)?на день)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'day',
        description: 'Ваше расписание на день'
    };

    async handler({ context, chat, actions }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0 && Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        if (chat.mode == 'student' || chat.mode == 'parent') return this.groupRasp(context, chat, actions)
        if (chat.mode == 'teacher') return this.teacherRasp(context, chat, actions)

        return context.send('Первоначальная настройка ещё не была произведена')
    }

    private async groupRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction) {
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

        const message = buildGroupTextRasp(chat.group, getDayRasp(rasp.days), false, chat.showParserTime)

        actions.deleteUserMsg()

        return context.send(message).then(context => actions.handlerLastMsgUpdate(context))
    }

    private async teacherRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction) {
        if (chat.teacher == null) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

            return context.send(
                'Имя учителя не выбрано\n\n' +
                'Выбрать группу можно командой /setTacher <teacher>\n' +
                'Пример:\n' +
                `/setTeacher ${randTeacher}`
            )
        }

        if (Object.keys(raspCache.teachers.timetable).length == 0) return context.send('Данные с сервера ещё не загружены, ожидайте...')

        const rasp = raspCache.teachers.timetable[chat.teacher]
        if (rasp === undefined) return context.send('Ничего не найдено');

        actions.deleteLastMsg()

        const message = buildTeacherTextRasp(chat.teacher, getDayRasp(rasp.days), false, chat.showParserTime)

        actions.deleteUserMsg()

        context.send(message).then(context => actions.handlerLastMsgUpdate(context))
    }
}