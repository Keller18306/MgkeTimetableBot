import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";
import { CommandController } from "../../controller";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)regexp$/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand | null = {
        command: 'regexp',
        description: 'Отобразить все команды и регулярки к ним'
    };

    handler({ context }: CmdHandlerParams) {
        const commands = CommandController.instance.commands;

        const message: string[] = [];
        for (const id in commands) {
            const { instance } = commands[id];
            const regexp: string = String(instance.regexp);

            message.push(`${id}: ${regexp}`)
        }

        return context.send(message.join('\n'));
    }
}