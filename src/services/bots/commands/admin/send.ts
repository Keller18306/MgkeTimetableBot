import { TelegramBotCommand } from 'puregram/generated';
import { EventController, ServiceProgressCallback } from '../../../../updater/events/controller';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)send/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'send',
        description: 'Рассылка всем пользователям в боте'
    };

    async handler({ context }: CmdHandlerParams) {
        const message = context.text?.replace(this.regexp, '').trim();
        if (!message) return context.send('Сообщение не введено');

        await context.send('Начинаю отправку сообщений.');

        let progress: Parameters<ServiceProgressCallback>[0] | undefined;
        let lastText: string | undefined;
        const interval = setInterval(async () => {
            if (!progress) return;

            const text = `${progress.service}: ${progress.position}/${progress.count} (${(progress.position * 100 / progress.count).toFixed(2)}%)`;
            if (text === lastText) return;
            lastText = text;

            await context.editOrSend(text);
        }, 1e3);

        await EventController.sendDistibution(message, (data) => {
            progress = data
        });

        clearInterval(interval);
        await context.editOrSend('Успешно отправлено!')
    }
}