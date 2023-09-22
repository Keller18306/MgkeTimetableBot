import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)button(s)?$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'buttons',
        description: 'Обновить клавиатуру бота'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        return context.send('Клавиатура показана', {
            keyboard: keyboard.MainMenu
        })
    }
}