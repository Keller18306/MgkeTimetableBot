import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)button(s)?)|(⌨️\s)?(Настройка кнопок|Кнопки)$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'buttons',
        description: 'Настройки кнопок бота'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.scene = 'settings';

        return context.send('Меню настройки кнопок.', {
            keyboard: keyboard.SettingsButtons
        })
    }
}