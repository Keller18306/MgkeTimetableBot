import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { buildTeacherTextRasp, getDayRasp } from "../../../../utils/buildTextRasp";
import { randArray } from "../../../../utils/rand";
import { DefaultCommand, HandlerParams } from "../../abstract/command";
import { StaticKeyboard } from "../../keyboard";

export default class extends DefaultCommand {
    public id = 'find_teacher_week';

    public regexp = /^(((!|\/)(get|find)?teacherWeek)|(Учитель|Преподаватель|Препод\.?)\s?Неделя)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teacherweek',
        description: 'Узнать расписание на неделю указанного преподавателя (не зависит от текущего вашего)'
    };

    async handler({ context, chat, keyboard }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let teacher: string | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

            teacher = await context.input(`Введите фамилию учителя, которого хотите узнать расписание на неделю (например, ${randTeacher})`, {
                keyboard: StaticKeyboard.Cancel
            });
        }

        while (true) {
            teacher = await this.findTeacher(context, teacher, keyboard.MainMenu);

            if (!teacher) {
                if (teacher === undefined) {
                    teacher = await context.waitInput()
                    continue;
                } else {
                    return;
                }
            }

            break;
        }

        const teacherRasp = raspCache.teachers.timetable[teacher];
        const message = buildTeacherTextRasp(teacher, teacherRasp.days, true, chat.showParserTime);

        return context.send(message);
    }
}