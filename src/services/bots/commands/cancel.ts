import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = /^\/cancel$/i;
    public payloadAction = 'cancel';
    public tgCommand: TelegramBotCommand = {
        command: 'cancel',
        description: 'Отменить действие ввода (если таковое имеется)'
    };

    handler({ context, keyboard, chat }: CmdHandlerParams) {
        context.cancelInput();
        chat.scene = null;

        return context.send('Ввод был отменён', {
            keyboard: keyboard.MainMenu
        });
    }
}