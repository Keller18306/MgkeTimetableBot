import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../abstract";

export default class extends DefaultCommand {
    public id = 'menu'

    public regexp = /^(\/menu)|(Меню)$/i;
    public payload: string | null = null;
    public scene?: string | null | undefined = undefined;
    public tgCommand: TelegramBotCommand = {
        command: 'menu',
        description: 'Вернуться в главное меню бота'
    };

    handler({ context, keyboard, chat }: HandlerParams) {
        context.cancelInput()
        chat.scene = null;

        return context.send('Главное меню', {
            keyboard: keyboard.MainMenu
        })
    }
}