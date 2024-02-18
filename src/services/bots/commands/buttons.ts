import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)button(s)?_reload$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'buttons_reload',
        description: 'Обновить клавиатуру бота'
    };

    handler({ context, keyboard }: CmdHandlerParams) {
        return context.send('Клавиатура обновлена', {
            keyboard: keyboard.MainMenu
        })
    }
}