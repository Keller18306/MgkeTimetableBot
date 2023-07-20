import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { CommandController } from "../../command";

export default class extends AbstractCommand {
    public id = 'admin_regexp'

    public regexp = /^(!|\/)regexp$/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand | null = {
        command: 'regexp',
        description: 'Отобразить все команды и регулярки к ним'
    };

    handler({ context }: HandlerParams) {
        const commands = CommandController.instance.commands;

        const message: string[] = [];
        for (const id in commands) {
            const { command } = commands[id];
            const regexp: string = String(command.regexp);

            message.push(`${id}: ${regexp}`)
        }

        return context.send(message.join('\n'));
    }
}