import { TelegramBotCommand } from 'puregram/generated';
import { raspCache } from '../../../../updater';
import { GroupDay, TeacherDay } from '../../../../updater/parser/types';
import { buildGroupTextRasp, buildTeacherTextRasp, removePastDays } from "../../../../utils/buildTextRasp";
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

    async handler({ context, chat, actions }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0 &&
            Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        if (chat.mode == 'student' || chat.mode == 'parent') return this.groupRasp(context, chat, actions);
        if (chat.mode == 'teacher') return this.teacherRasp(context, chat, actions);

        return context.send('Первоначальная настройка ещё не была произведена');
    }

    private async groupRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction) {
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

        const message = buildGroupTextRasp(chat.group, days, false, chat.showParserTime);
        //const image = await ImageBuilder.getGroupImage(group);

        actions.deleteUserMsg();

        const id = await context.send(message).then(id => {
            actions.handlerLastMsgUpdate(context)
            return id;
        });

        //return context.sendPhoto(image, { reply_to: id })
    }

    private async teacherRasp(context: AbstractCommandContext, chat: AbstractChat, actions: AbstractAction) {
        if (chat.teacher == null) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

            return context.send(
                'Имя учителя не выбрано\n\n' +
                'Выбрать группу можно командой /setTacher <teacher>\n' +
                'Пример:\n' +
                `/setTeacher ${randTeacher}`
            );
        }

        const teacher = raspCache.teachers.timetable[chat.teacher];
        if (teacher === undefined) return context.send('Данного учителя не существует');

        let days: TeacherDay[] = teacher.days;
        if (chat.removePastDays) {
            days = removePastDays(days);
        }

        actions.deleteLastMsg();

        const message: string = buildTeacherTextRasp(chat.teacher, days, false, chat.showParserTime);

        actions.deleteUserMsg();

        return context.send(message).then(context => actions.handlerLastMsgUpdate(context));
    }
}