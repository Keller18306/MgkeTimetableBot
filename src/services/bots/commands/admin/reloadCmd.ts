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

    async handler({ context }: CmdHandlerParams) {
        const id = context.text?.replace(this.regexp, '').trim();
        if (!id) return context.send('id команды не введён');

        try {
            await CommandController.reloadCommandById(id);
        } catch (e) {
            console.log(e);
            return context.send('Во время перезагрузки команды произошла ошибка');
        }

        return context.send('Команда перезагружена')
    }
}