import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'get_settings_formatter'

    public regexp = /^(📃\s)?(Настройка форматировщика|Форматировщик)$/i
    public payload = null;
    public scene = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        return context.send('Меню настройки форматировщика.', {
            keyboard: keyboard.SettingsFormatters
        });
    }
}