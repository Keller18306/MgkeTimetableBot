import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'get_settings_buttons'

    public regexp = /^(⌨️\s)?Настройка кнопок$/i
    public payload = null;
    public scene = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        return context.send('Меню настройки кнопок.', {
            keyboard: keyboard.SettingsButtons
        })
    }
}