import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)help$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand | null = {
        command: 'help',
        description: 'Отобразить все команды бота'
    };

    handler({ context }: CmdHandlerParams) {
        const commands = this.app.getService('bot').commands;

        const message: string[] = ['Список команд бота:'];
        for (const id in commands) {
            const { instance } = commands[id];
            if (!instance.tgCommand) continue;

            //todo bot admin help
            if (instance.adminOnly) continue;

            const tgCommands = Array.isArray(instance.tgCommand) ? instance.tgCommand : [instance.tgCommand];
            for (const tgCommand of tgCommands) {
                message.push(`/${tgCommand.command} - ${tgCommand.description}`);
            }
        }

        return context.send(message.join('\n'));
    }
}