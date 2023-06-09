import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'get_settings'

    public regexp = /^((!|\/)settings)|((⚙️\s)?Настройки|Меню настроек)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'settings',
        description: 'Персональные настройки бота'
    };

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.scene = 'settings';

        return context.send('Вы перешли в меню настроек.', {
            keyboard: keyboard.SettingsMain
        })
    }
}