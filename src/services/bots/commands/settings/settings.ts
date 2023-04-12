import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_settings'

    public regexp = /^((!|\/)settings)|((⚙️\s)?Настройки)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'settings',
        description: 'Персональные настройки бота'
    };

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.scene = 'settings'

        return context.send('Вы перешли в меню настроек.', {
            keyboard: keyboard.Settings
        })
    }
}