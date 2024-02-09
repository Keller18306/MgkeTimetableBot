import { randArray } from "../../../../utils";
import { raspCache } from "../../../parser";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^\/setGroup/i
    public payload = null;

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        const group = context.text!.split(' ')[1]

        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const randGroup = randArray(Object.keys(raspCache.groups.timetable))

            return context.send(
                'Неправильный синтаксис команды\n\n' +
                'Пример:\n' +
                `/setGroup ${randGroup}`
            );
        }

        if (!Object.keys(raspCache.groups.timetable).includes(group)) {
            return context.send('Данной учебной группы не существует')
        }

        chat.group = Number(group);
        chat.mode = 'student';
        chat.scene = null;

        return context.send(`Группа этого чата была успешно изменена на '${group}'`, {
            keyboard: keyboard.MainMenu
        })
    }
}