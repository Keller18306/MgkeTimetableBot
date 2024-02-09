import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../parser";
import { WeekIndex, randArray } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { withCancelButton } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(get|find)?teacherWeek)|(Учитель|Преподаватель|Препод\.?)\s?Неделя)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teacherweek',
        description: 'Узнать расписание на неделю указанного преподавателя (не зависит от текущего вашего)'
    };

    async handler({ context, chat, keyboard, scheduleFormatter }: CmdHandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let initiator: InputInitiator;
        let teacher: string | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

            teacher = await context.input(`Введите фамилию преподавателя, которого хотите узнать расписание на неделю (например, ${randTeacher})`, {
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
        
        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();
        const days = this.app.getService('timetable').getTeacherDaysByRange(weekRange, teacher);

        const message = scheduleFormatter.formatTeacherFull(teacher, {
            showHeader: true,
            days: days
        });

        const options: MessageOptions = {
            keyboard: keyboard.WeekControl('teacher', teacher, weekIndex.valueOf(), false)
        }
        
        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }
}