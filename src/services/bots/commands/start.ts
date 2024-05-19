import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../abstract";
import { StaticKeyboard } from "../keyboard";

export default class extends AbstractCommand {
    public regexp = /(^(!|\/)start)|^(Начать|Start|(Главное\s)?Меню)$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'start',
        description: 'Запустить бота'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        if (chat.mode !== null) {
            context.cancelInput();
            chat.scene = null;

            return context.send('Главное меню', {
                keyboard: keyboard.MainMenu
            });
        }

        chat.scene = 'setup';

        return context.send('Кто будет использовать бота?', {
            keyboard: StaticKeyboard.SelectMode
        });
    }
}