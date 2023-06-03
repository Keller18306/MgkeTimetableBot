import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../abstract";

export default class extends DefaultCommand {
    public id = 'cancel'

    public regexp = /^\/cancel$/i;
    public payload = 'cancel';
    public tgCommand: TelegramBotCommand = {
        command: 'cancel',
        description: 'Отменить действие ввода (если таковое имеется)'
    };

    handler({ context, keyboard, chat }: HandlerParams) {
        context.cancelInput()
        chat.scene = null;

        return context.send('Ввод был отменён', {
            keyboard: keyboard.MainMenu
        })
    }
}