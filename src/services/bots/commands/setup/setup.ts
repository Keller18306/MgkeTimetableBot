import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { StaticKeyboard } from "../../keyboard";

export default class extends AbstractCommand {
    public id = 'setup'

    public regexp = /^(!|\/)setup|(📚\s)?Первоначальная настройка$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'setup',
        description: 'Сменить группу или преподавателя'
    };

    handler({ context, chat }: HandlerParams) {
        //if (chat.isChat) return context.send('Недоступно в беседе');

        chat.scene = 'setup';

        return context.send('Кто будет использовать бота?', {
            keyboard: StaticKeyboard.SelectMode
        })
    }
}