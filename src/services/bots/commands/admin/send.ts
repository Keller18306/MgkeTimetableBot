import { TelegramBotCommand } from 'puregram/generated';
import { DefaultCommand, HandlerParams } from "../../abstract/command";
import { EventController } from '../../../../updater/events/controller';

export default class extends DefaultCommand {
    public id = 'admin_send'
    public regexp = /^(!|\/)send/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'send',
        description: 'Рассылка всем пользователям в боте'
    };

    async handler({ context, chat }: HandlerParams) {
        const message = context.text?.replace(this.regexp, '').trim()
        if (!message) return context.send('Сообщение не введено');

        await EventController.sendDistibution(message);

        return context.send('Отправлено')
    }
}