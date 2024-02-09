import { defines } from "../../../../defines";
import { raspCache } from "../../../parser";
import { randArray } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { StaticKeyboard } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^(👩‍🏫\s)?(Учитель|Преподаватель)$/i
    public payload = null;
    public scene?: string | null = 'setup';

    async handler({ context, chat, keyboard, service }: CmdHandlerParams) {
        if (Object.keys(raspCache.teachers.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        const randTeacher = randArray(Object.keys(raspCache.teachers.timetable));

        let initiator: InputInitiator;
        let teacher: string | null | false | undefined = await context.input(`Введите фамилию преподавателя (например, ${randTeacher})`, {
            keyboard: StaticKeyboard.Cancel
        }).then<string | undefined>(value => {
            initiator = value?.initiator;

            return value?.text;
        });

        while (true) {
            teacher = await this.findTeacher(context, keyboard, teacher);

            if (!teacher) {
                teacher = await context.waitInput().then<string | undefined>(value => {
                    initiator = value?.initiator;

                    return value?.text;
                });
                continue;
            }

            break;
        }

        chat.teacher = teacher;
        chat.mode = 'teacher';
        chat.group = null;
        chat.scene = null;
        chat.deactivateSecondaryCheck = false;

        const options: MessageOptions = {
            keyboard: keyboard.MainMenu
        }

        return context.send(defines[`${service}.message.about`], options);
    }
}