import { TelegramBotCommand } from 'puregram/generated';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)force_?parse/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'forceParse',
        description: 'Спарсить расписание прямо сейчас'
    };

    async handler({ context }: CmdHandlerParams) {
        const clearKeys: boolean = context.text?.replace(this.regexp, '').trim() === 'true';

        this.app.getService('parser').forceParse(clearKeys);

        return context.send('Запущено');
    }
}