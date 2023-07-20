import { TelegramBotCommand } from 'puregram/generated';
import { Updater } from '../../../../updater';
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)force_?parse/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'forceParse',
        description: 'Спарсить расписание прямо сейчас'
    };

    async handler({ context }: HandlerParams) {
        const clearKeys: boolean = context.text?.replace(this.regexp, '').trim() === 'true';

        Updater.getInstance().forceParse(clearKeys);

        return context.send('Запущено');
    }
}