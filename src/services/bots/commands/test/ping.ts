import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)ping$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'ping',
        description: 'Проверка работоспособности бота'
    };

    handler({ context }: CmdHandlerParams) {
        return context.send('pong')
    }
}