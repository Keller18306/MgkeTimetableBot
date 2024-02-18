import { TelegramBotCommand } from 'puregram/generated';
import { AppServiceName } from '../../../../app';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)force_?parse/i
    public payloadAction = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'forceParse',
        description: 'Спарсить расписание прямо сейчас'
    };

    public requireServices: AppServiceName[] = ['parser'];

    async handler({ context }: CmdHandlerParams) {
        const clearKeys: boolean = context.text?.replace(this.regexp, '').trim() === 'true';

        this.app.getService('parser').forceLoopParse(clearKeys);

        return context.send('Запущено');
    }
}