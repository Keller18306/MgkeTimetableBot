import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { getDayRasp } from "../../../../utils/buildTextRasp";
import { randArray } from "../../../../utils/rand";
import { DefaultCommand, HandlerParams } from "../../abstract/command";
import { withCancelButton } from "../../keyboard";

export default class extends DefaultCommand {
    public id = 'find_teacher_day';

    public regexp = /^(((!|\/)(get|find)?teacher(Day)?)|(👩‍🏫\s)?(Учитель|Преподаватель|Препод\.?)(\s?День)?)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teacher',
        description: 'Узнать расписаниена день указанного преподавателя (не зависит от текущего вашего)'
    };
    public scene?: string | null = null;

    async handler({ context, chat, keyboard, scheduleFormatter }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let teacher: string | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

            teacher = await context.input(`Введите фамилию преподавателя, которого хотите узнать расписание на день (например, ${randTeacher})`, {
                keyboard: withCancelButton(keyboard.TeacherHistory)
            });
        }

        while (true) {
            teacher = await this.findTeacher(context, keyboard, teacher, keyboard.MainMenu);

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

        chat.appendTeacherSearchHistory(teacher);
        const teacherRasp = raspCache.teachers.timetable[teacher];
        const message = scheduleFormatter.formatTeacherFull(teacher, {
            showHeader: true,
            days: getDayRasp(teacherRasp.days)
        })

        return context.send(message);
    }
}