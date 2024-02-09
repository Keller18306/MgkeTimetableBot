import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../parser";
import { getDayRasp, randArray } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { withCancelButton } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(get|find)?teacher(Day)?)|(👩‍🏫\s)?(Учитель|Преподаватель|Препод\.?)(\s?День)?)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teacher',
        description: 'Узнать расписаниена день указанного преподавателя (не зависит от текущего вашего)'
    };
    public scene?: string | null = null;

    async handler({ context, chat, keyboard, scheduleFormatter }: CmdHandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let initiator: InputInitiator;
        let teacher: string | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

            teacher = await context.input(`Введите фамилию преподавателя, которого хотите узнать расписание на день (например, ${randTeacher})`, {
                keyboard: withCancelButton(keyboard.TeacherHistory)
            }).then<string | undefined>(value => {
                initiator = value?.initiator;

                return value?.text;
            });
        }

        while (true) {
            teacher = await this.findTeacher(context, keyboard, teacher, keyboard.MainMenu);

            if (!teacher) {
                if (teacher === undefined) {
                    teacher = await context.waitInput().then<string | undefined>(value => {
                        initiator = value?.initiator;

                        return value?.text;
                    });
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
            days: getDayRasp(teacherRasp.days, true, 2)
        });

        const options: MessageOptions = {
            keyboard: keyboard.GetWeekTimetable('teacher', teacher)
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }
}