import { TelegramBotCommand } from "puregram/generated";
import { WeekIndex, getDayRasp, randArray } from "../../../../utils";
import { ImageFile } from "../../../image/builder";
import { raspCache } from "../../../parser";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { StaticKeyboard, withCancelButton } from "../../keyboard";

export default class GetTeacherCommand extends AbstractCommand {
    public regexp = {
        day: /^(((!|\/)(get|find)?teacher(Day)?)|(👩‍🏫\s)?(Учитель|Преподаватель|Препод\.?)(\s?День)?)(\b|$|\s)/i,
        week: /^(((!|\/)(get|find)?teacherWeek)|(Учитель|Преподаватель|Препод\.?)\s?Неделя)(\b|$|\s)/i,
        image: /^(((!|\/)((get|find)?(teacherImage|imageTeacher)))|((Преподаватель|Учитель)(фотография|таблица)))(\b|$|\s)/i
    };
    public payloadAction = null;
    public scene?: string | null = null;
    public tgCommand: TelegramBotCommand[] = [
        {
            command: 'teacher',
            description: 'Узнать расписаниена день указанного преподавателя (не зависит от текущего вашего)'
        },
        {
            command: 'teacherweek',
            description: 'Узнать расписание на неделю указанного преподавателя (не зависит от текущего вашего)'
        },
        {
            command: 'teacherimage',
            description: 'Сгенерировать фотографию расписания преподавателя (не зависит от текущего вашего)'
        }
    ];

    async handler(params: CmdHandlerParams<GetTeacherCommand>) {
        const { context, chat, keyboard, regexp } = params;

        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let initiator: InputInitiator;
        let teacher: string | false | undefined = context.text?.replace(this.getRegExp(params), '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

            teacher = await context.input(`Введите фамилию преподавателя, у которого хотите узнать расписание (например, ${randTeacher})`, {
                keyboard: withCancelButton(keyboard.TeacherHistory)
            }).then<string | undefined>(value => {
                initiator = value?.initiator;

                return value?.text;
            });
        }

        while (true) {
            teacher = await this.findTeacher(params, teacher, keyboard.MainMenu);

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

        chat.appendTeacherHistory(teacher);

        if (regexp === 'day') {
            return this.sendDay(teacher, initiator, params);
        }

        if (regexp === 'week') {
            return this.sendWeek(teacher, initiator, params);
        }

        if (regexp === 'image') {
            return this.sendImage(teacher, initiator, params);
        }

        throw new Error('unknown error');
    }

    private async sendDay(teacher: string, initiator: InputInitiator, { context, formatter }: CmdHandlerParams) {
        const teacherRasp = raspCache.teachers.timetable[teacher];
        const message = formatter.formatTeacherFull(teacher, {
            showHeader: true,
            days: getDayRasp(teacherRasp.days, true, 2)
        });

        const options: MessageOptions = {
            keyboard: StaticKeyboard.GetWeekTimetable({ type: 'teacher', value: teacher })
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }

    private async sendWeek(teacher: string, initiator: InputInitiator, { context, keyboard, formatter }: CmdHandlerParams) {
        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();
        const days = await this.app.getService('timetable').getTeacherDaysByRange(weekRange, teacher);

        const message = formatter.formatTeacherFull(teacher, {
            showHeader: true,
            days: days
        });

        const options: MessageOptions = {
            keyboard: await keyboard.WeekControl('teacher', teacher, weekIndex.valueOf(), false)
        }

        if (initiator === 'callback') {
            return context.editOrSend(message, options);
        }

        return context.send(message, options);
    }

    private async sendImage(teacher: string, initiator: InputInitiator, { context }: CmdHandlerParams) {
        const weekIndex = WeekIndex.getRelevant();
        const weekRange = weekIndex.getWeekDayIndexRange();
        const days = await this.app.getService('timetable').getTeacherDaysByRange(weekRange, teacher);

        const image: ImageFile = await this.app.getService('image').builder.getTeacherImage(teacher, days);

        return context.sendPhoto(image);
    }

    private getRegExp({ regexp }: CmdHandlerParams<GetTeacherCommand>): RegExp {
        if (!regexp) {
            throw new Error('regexp initiator not matched');
        }

        return this.regexp[regexp];
    }
}