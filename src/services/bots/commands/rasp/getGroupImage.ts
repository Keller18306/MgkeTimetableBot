import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { randArray } from "../../../../utils";
import { ImageBuilder, ImageFile } from "../../../image/builder";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(((!|\/)(get)?(groupImage|imageGroup))|(Группа(фото(графия)?|таблица)))(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'groupimage',
        description: 'Сгенерировать фотографию расписания группы (не зависит от текущего вашего)'
    };

    async handler({ context, chat }: CmdHandlerParams) {
        if (Object.keys(raspCache.groups.timetable).length == 0) {
            return context.send('Данные с сервера ещё не загружены, ожидайте...');
        }

        const group = context.text?.replace(this.regexp, '').trim();
        if (group == '' || group == undefined || group.length > 3 || isNaN(+group)) {
            const cmd = context.text?.match(this.regexp)?.[0].trim();

            const randGroup = randArray(Object.keys(raspCache.groups.timetable));

            return context.send(
                'Неправильный синтаксис команды\n\n' +
                'Пример:\n' +
                `${cmd} ${randGroup}`
            );
        }

        chat.appendGroupSearchHistory(String(group));
        const groupRasp = raspCache.groups.timetable[group];
        if (groupRasp === undefined) {
            return context.send('Данной учебной группы не существует');
        }

        const image: ImageFile = await ImageBuilder.getGroupImage(group, groupRasp.days);

        return context.sendPhoto(image);
    }
}