import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)view)|(🖼️\s)?(Отображение)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'view',
        description: 'Настройки отображения расписания'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.scene = 'settings';

        return context.send('Меню настройки отображения внешнего вида расписания.', {
            keyboard: keyboard.SettingsView
        })
    }
}