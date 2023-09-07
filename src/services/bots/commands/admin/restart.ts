import { execSync } from "child_process";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { TelegramBotCommand } from "puregram/generated";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)restart$/i
    public payload = null;
    public adminOnly: boolean = true;

    public tgCommand: TelegramBotCommand = {
        command: 'restart',
        description: 'Перезапуск бота (только при использовании PM2)'
    };

    async handler({ context, service }: HandlerParams) {
        await context.send('Restarting...');

        setTimeout(() => {
            execSync('pm2 restart 0');
        }, 1e3)
    }
}