import { TelegramBotCommand } from 'puregram/generated';
import { AppServiceName } from '../../../../app';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)flushCache/i
    public payloadAction = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'flushCache',
        description: 'Сбросить расписание из кэша парсера в БД'
    };

    public requireServices: AppServiceName[] = ['parser'];

    async handler({ context }: CmdHandlerParams) {
        await context.send('Сброс начат...');

        await this.app.getService('parser').flushCache();

        return context.editOrSend('Сброс закончен');
    }
}