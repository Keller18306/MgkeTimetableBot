import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, HandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)button(s)?$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'buttons',
        description: 'Обновить клавиатуру бота'
    };

    handler({ context, chat, keyboard }: HandlerParams) {
        return context.send('Клавиатура показана', {
            keyboard: keyboard.MainMenu
        })
    }
}