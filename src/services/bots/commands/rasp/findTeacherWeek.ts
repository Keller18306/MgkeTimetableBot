import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { withCancelButton } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(get|find)?teacherWeek)|(Учитель|Преподаватель|Препод\.?)\s?Неделя)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teacherweek',
        description: 'Узнать расписание на неделю указанного преподавателя (не зависит от текущего вашего)'
    };

    async handler({ context, chat, keyboard, scheduleFormatter }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let teacher: string | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

            teacher = await context.input(`Введите фамилию преподавателя, которого хотите узнать расписание на неделю (например, ${randTeacher})`, {
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
        const message = scheduleFormatter.formatTeacherFull(teacher, {
            showHeader: true
        })

        return context.send(message, {
            keyboard: keyboard.GenerateImage('teacher', teacher)
        });
    }
}