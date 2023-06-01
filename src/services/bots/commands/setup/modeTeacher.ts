import { defines } from "../../../../defines";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { DefaultCommand, HandlerParams } from "../../abstract/command";
import { StaticKeyboard } from "../../keyboard";

export default class extends DefaultCommand {
    public id = 'modeTeacher'

    public regexp = /^(👩‍🏫\s)?(Учитель|Преподаватель)$/i
    public payload = null;
    public scene?: string | null = 'setup';

    async handler({ context, chat, keyboard, service }: HandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) return context.send('Данные с сервера ещё не загружены, ожидайте...')

        const randTeacher = randArray(Object.keys(raspCache.teachers.timetable))

        let teacher: string | null | false | undefined = await context.input(`Введите фамилию учителя (например, ${randTeacher})`, {
            keyboard: StaticKeyboard.Cancel
        })

        while (true) {
            teacher = await this.findTeacher(context, keyboard, teacher)

            if (!teacher) {
                teacher = await context.waitInput()
                continue;
            }

            break;
        }

        chat.teacher = teacher
        chat.mode = 'teacher';
        chat.group = null;
        chat.scene = null;
        chat.deactivateSecondaryCheck = false;

        context.send(defines[`${service}.message.about`], {
            keyboard: keyboard.MainMenu
        })
    }
}