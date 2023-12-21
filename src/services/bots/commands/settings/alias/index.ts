import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)(alias|aliases))|(⌨️\s)?(Настройка алиасов|Алиасы)$/i
    public payload = null;
    // public tgCommand: TelegramBotCommand = {
    //     command: 'alias',
    //     description: 'Настройки алиасов'
    // };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.scene = 'settings_alias';

        return context.send('Меню настройки алиасов.', {
            keyboard: keyboard.SettingsAliases
        })
    }
}