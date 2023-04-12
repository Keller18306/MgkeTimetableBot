import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../abstract/command";
import { StaticKeyboard } from "../keyboard";

export default class extends DefaultCommand {
    public id = 'start'

    public regexp = /^Начать|Start|Настроить$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'start',
        description: 'Запустить бота'
    };

    handler({ context, chat, keyboard, service }: HandlerParams) {
        if (context.isChat) return;

        if (chat.mode !== null) return context.send('Главное меню', {
            keyboard: keyboard.MainMenu
        });

        chat.scene = 'setup';

        return context.send('Кто будет использовать бота?', {
            keyboard: StaticKeyboard.SelectMode
        })
    }
}