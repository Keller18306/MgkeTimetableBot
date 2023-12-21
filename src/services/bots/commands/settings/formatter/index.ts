import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)formatter)|(📃\s)?(Настройка форматировщика|Форматировщик)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'formatter',
        description: 'Настройки форматировщика'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.scene = 'settings';

        return context.send('Меню настройки форматировщика.', {
            keyboard: keyboard.SettingsFormatters
        });
    }
}