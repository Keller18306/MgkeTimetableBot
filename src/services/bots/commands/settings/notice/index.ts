import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)notice)|(🔊\s)?(Настройка оповещений|Оповещения)$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'notice',
        description: 'Настройки оповещений'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.scene = 'settings';

        return context.send('Меню настройки оповещений.', {
            keyboard: keyboard.SettingsNotice
        })
    }
}