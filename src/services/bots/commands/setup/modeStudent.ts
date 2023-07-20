import { defines } from "../../../../defines";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { StaticKeyboard } from "../../keyboard";

export default class extends AbstractCommand {
    public id = 'modeStudent'

    public regexp = /^((👩‍🎓\s)?(Ученик|Учащийся)|(👨‍👩‍👦\s)?Родитель)$/i
    public payload = null;
    public scene?: string | null = 'setup';

    async handler({ context, chat, keyboard, service }: HandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...')
        }

        const randGroup = randArray(Object.keys(raspCache.groups.timetable))

        let group: string | number | false | undefined = await context.input(`Введите номер своей группы (например, ${randGroup})`, {
            keyboard: StaticKeyboard.Cancel
        });

        while (true) {
            group = await this.findGroup(context, keyboard, group)

            if (!group) {
                group = await context.waitInput()
                continue;
            }

            break;
        }

        if (context.text.match(/^(👨‍👩‍👦\s)?Родитель$/i)) {
            chat.mode = 'parent'
        } else {
            chat.mode = 'student'
        }

        chat.group = group
        chat.teacher = null
        chat.scene = null;
        chat.deactivateSecondaryCheck = false;

        context.send(defines[`${service}.message.about`], {
            keyboard: keyboard.MainMenu
        })
    }
}