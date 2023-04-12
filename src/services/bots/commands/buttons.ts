import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_buttons'

    public regexp = /^(!|\/)button(s)?$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'buttons',
        description: 'Обновить клавиатуру бота'
    };

    handler({ context, chat, keyboard }: HandlerParams) {
        context.send('Клавиатура показана', {
            keyboard: keyboard.MainMenu
        })
    }
}