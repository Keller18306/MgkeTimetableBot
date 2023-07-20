import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'ping'

    public regexp = /^(!|\/)ping$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'ping',
        description: 'Проверка работоспособности бота'
    };

    handler({ context }: HandlerParams) {
        return context.send('pong')
    }
}