import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils/rand";
import { ImageBuilder, ImageFile } from "../../../image/builder";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'find_teacher_image';

    public regexp = /^(((!|\/)((get|find)?(teacherImage|imageTeacher)))|((Преподаватель|Учитель)(фотография|таблица)))(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teacherimage',
        description: 'Сгенерировать фотографию расписания преподавателя (не зависит от текущего вашего)'
    };

    async handler({ context, chat }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        let teacher = context.text?.replace(this.regexp, '').trim();
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const cmd = context.text?.match(this.regexp)?.[0].trim();

            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

            return context.send(
                'Неправильный синтаксис команды\n\n' +
                'Пример:\n' +
                `${cmd} ${randTeacher}`
            );
        }

        const matched: string[] = [];
        const matchLimit: number = 5;

        for (const sys_teacher of Object.keys(raspCache.teachers.timetable)) {
            if (sys_teacher.toLocaleLowerCase().search(teacher.toLocaleLowerCase()) === -1) continue;

            matched.push(sys_teacher);
            if (matched.length > matchLimit) break;
        }

        if (matched.length === 0) return context.send('Данный преподаватель не найден');
        if (matched.length > matchLimit) return context.send('Слишком много результатов для выборки.');
        if (matched.length > 1) return context.send(
            'Найдено несколько учиетелей.\n' +
            'Какой именно нужен?\n\n' +
            matched.join('\n')
        );

        teacher = matched[0];

        chat.appendTeacherSearchHistory(teacher);
        const teacherRasp = raspCache.teachers.timetable[teacher];
        const image: ImageFile = await ImageBuilder.getTeacherImage(teacherRasp);

        return context.sendPhoto(image);
    }
}