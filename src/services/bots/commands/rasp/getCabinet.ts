import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { TeacherLessonExplain } from "../../../../updater/parser/types";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_cabinet_info';

    public regexp = /^((!|\/)(get)?cabinet)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'cabinet',
        description: 'Получить информацию по кабинету'
    };
    public scene?: string | null = null;

    async handler({ context }: HandlerParams) {
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
                    weekday: string,
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
                            weekday: day.weekday,
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

            for (const { day, weekday, lessons } of Object.values(info[cabinet])) {
                const dayMessage: string[] = [];

                dayMessage.push(`${weekday}, ${day}`);

                for (const lesson of lessons) {
                    dayMessage.push(`${lesson.index + 1}. ${lesson.lesson} (${lesson.type}), ${lesson.group}, ${lesson.teacher}`);
                }

                cabinetMessage.push(dayMessage.join('\n'));
            }

            message.push(cabinetMessage.join('\n\n'));
        }

        return context.send(message.join('\n\n'));
    }
}