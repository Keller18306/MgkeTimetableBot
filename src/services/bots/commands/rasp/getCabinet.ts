import { TelegramBotCommand } from "puregram/generated";
import { StringDate } from "../../../../utils";
import { raspCache } from "../../../parser";
import { TeacherLessonExplain } from "../../../parser/types";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)(get)?cabinet)(\b|$|\s)/i;
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'cabinet',
        description: 'Получить информацию по кабинету'
    };
    public scene?: string | null = null;

    async handler({ context }: CmdHandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let cabinet: string | number | false | undefined = context.text?.replace(this.regexp, '').trim();
        if (!cabinet) {
            return context.send('Номер кабинета не указан');
        }

        const info: {
            [cabinet: string]: {
                [day: string]: {
                    day: string,
                    lessons: (TeacherLessonExplain & { index: number, teacher: string })[]
                }
            }
        } = {}

        for (const teacherName in raspCache.teachers.timetable) {
            const teacher = raspCache.teachers.timetable[teacherName];

            for (const day of teacher.days) {
                for (const i in day.lessons) {
                    const lesson = day.lessons[i];

                    if (!lesson?.cabinet) continue;
                    if (lesson.cabinet.match(/(\d+-)?\d+/i)?.[0] !== cabinet.match(/(\d+-)?\d+/i)?.[0]) continue;

                    if (!info[lesson.cabinet]) {
                        info[lesson.cabinet] = {}
                    }

                    if (!info[lesson.cabinet][day.day]) {
                        info[lesson.cabinet][day.day] = {
                            day: day.day,
                            lessons: []
                        }
                    }

                    info[lesson.cabinet][day.day].lessons.push(Object.assign({}, lesson, {
                        index: Number(i),
                        teacher: teacher.teacher
                    }))
                }
            }
        }

        if (!Object.keys(info).length) {
            return context.send('Кабинет не найден.')
        }

        const message: string[] = [];

        for (const cabinet in info) {
            const cabinetMessage: string[] = [];

            cabinetMessage.push(`Кабинет: ${cabinet}`);

            for (const { day, lessons } of Object.values(info[cabinet])) {
                const dayMessage: string[] = [];

                dayMessage.push(`${StringDate.fromStringDate(day).getWeekdayName()}, ${day}`);

                for (const lesson of lessons) {
                    dayMessage.push(`${lesson.index + 1}. ${lesson.lesson} (${lesson.type}), ${lesson.subgroup ? `${lesson.subgroup}. ` : ''}${lesson.group}, ${lesson.teacher}`);
                }

                cabinetMessage.push(dayMessage.join('\n'));
            }

            message.push(cabinetMessage.join('\n\n'));
        }

        return context.send(message.join('\n\n'));
    }
}