import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)settings)|((⚙️\s)?Настройки|Меню настроек)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'settings',
        description: 'Настройки бота'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.scene = 'settings';

        return context.send('Вы перешли в меню настроек.', {
            keyboard: keyboard.SettingsMain
        })
    }
}