import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'set_teacher'

    public regexp = /^\/setTeacher/i
    public payload = null;

    handler({ context, chat, keyboard }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...')
        }

        let teacher = context.text?.replace(this.regexp, '').trim()
        if (teacher == '' || teacher == undefined || teacher.length < 3) {
            const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

            return context.send(
                'Неправильный синтаксис команды\n\n' +
                'Пример:\n' +
                `/setTeacher ${randTeacher}`
            );
        }

        const matched: string[] = []
        const matchLimit: number = 5;

        const fullTeachersList: string[] = Object.keys(raspCache.teachers.timetable)

        for (const sys_teacher of fullTeachersList) {
            if (sys_teacher.toLocaleLowerCase().search(teacher.toLocaleLowerCase()) === -1) continue;

            matched.push(sys_teacher)
            if (matched.length > matchLimit) break;
        }

        if (matched.length === 0) return context.send('Данный преподаватель не найден')
        if (matched.length > matchLimit) return context.send('Слишком много результатов для выборки.')
        if (matched.length > 1) return context.send(
            'Найдено несколько преподавателей.\n' +
            'Какой именно нужен?\n\n' +
            matched.join('\n')
        )

        teacher = matched[0]

        chat.teacher = teacher;
        chat.mode = 'teacher';
        chat.scene = null;

        return context.send(`Преподвателя этого чата был успешно изменен на '${teacher}'`, {
            keyboard: keyboard.MainMenu
        })
    }
}