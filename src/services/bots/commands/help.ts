import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand, HandlerParams } from "../abstract";
import { CommandController } from "../command";

export default class extends DefaultCommand {
    public id = 'help'

    public regexp = /^(!|\/)help$/i
    public payload = null;
    public tgCommand: TelegramBotCommand | null = {
        command: 'help',
        description: 'Отобразить все команды бота'
    };

    handler({ context, chat }: HandlerParams) {
        const commands = CommandController.instance.commands;

        const message: string[] = ['Список команд бота:'];
        for (const id in commands) {
            const { command } = commands[id];
            if (!command.tgCommand) continue;

            //todo bot admin help
            if (command.adminOnly) continue;

            const { tgCommand } = command;

            message.push(`/${tgCommand.command} - ${tgCommand.description}`)
        }

        return context.send(message.join('\n'));
    }
}