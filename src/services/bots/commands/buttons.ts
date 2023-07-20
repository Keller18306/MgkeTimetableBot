import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../abstract";

export default class extends DefaultCommand {
    public id = 'get_buttons'

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