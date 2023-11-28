import { defines } from "../../../../defines";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams, MessageOptions } from "../../abstract";
import { InputInitiator } from "../../input";
import { StaticKeyboard } from "../../keyboard";

export default class extends AbstractCommand {
    public regexp = /^((👩‍🎓\s)?(Ученик|Учащийся)|(👨‍👩‍👦\s)?Родитель)$/i
    public payload = null;
    public scene?: string | null = 'setup';

    async handler({ context, chat, keyboard, service }: CmdHandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        const randGroup = randArray(Object.keys(raspCache.groups.timetable));

        let initiator: InputInitiator;
        let group: string | number | false | undefined = await context.input(`Введите номер своей группы (например, ${randGroup})`, {
            keyboard: StaticKeyboard.Cancel
        }).then<string | undefined>(value => {
            initiator = value?.initiator;

            return value?.text;
        });

        while (true) {
            group = await this.findGroup(context, keyboard, group);

            if (!group) {
                group = await context.waitInput().then<string | undefined>(value => {
                    initiator = value?.initiator;

                    return value?.text;
                });
                continue;
            }

            break;
        }

        if (context.text.match(/^(👨‍👩‍👦\s)?Родитель$/i)) {
            chat.mode = 'parent';
        } else {
            chat.mode = 'student';
        }

        chat.group = group;
        chat.teacher = null;
        chat.scene = null;
        chat.deactivateSecondaryCheck = false;

        const options: MessageOptions = {
            keyboard: keyboard.MainMenu
        }

        if (initiator === 'callback') {
            return context.editOrSend(defines[`${service}.message.about`], options);
        }

        return context.send(defines[`${service}.message.about`], options);
    }
}