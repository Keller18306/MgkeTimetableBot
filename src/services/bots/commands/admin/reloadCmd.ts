import { TelegramBotCommand } from 'puregram/generated';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";
import { CommandController } from '../../controller';

export default class extends AbstractCommand {
    public regexp = /^(!|\/)reloadCmd/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'reloadCmd',
        description: 'Перезагрузить команду без перезапуска бота'
    };

    async handler({ context, chat }: CmdHandlerParams) {
        const id = context.text?.replace(this.regexp, '').trim();
        if (!id) return context.send('id команды не введён');

        CommandController.reloadCommandById(id);

        return context.send('Команда перезагружена')
    }
}