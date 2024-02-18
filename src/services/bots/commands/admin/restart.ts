import { execSync } from "child_process";
import { TelegramBotCommand } from "puregram/generated";
import { saveCache } from "../../../parser/raspCache";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)restart$/i
    public payloadAction = null;
    public adminOnly: boolean = true;

    public tgCommand: TelegramBotCommand = {
        command: 'restart',
        description: 'Перезапуск бота (только при использовании PM2)'
    };

    async handler({ context }: CmdHandlerParams) {
        await saveCache();

        await context.send('Restarting...');

        setTimeout(() => {
            execSync('pm2 restart 0');
        }, 1e3)
    }
}