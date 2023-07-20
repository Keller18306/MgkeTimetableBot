import { execSync } from "child_process";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)restart$/i
    public payload = null;
    public adminOnly: boolean = true;

    async handler({ context, service }: HandlerParams) {
        await context.send('Restarting...');

        setTimeout(() => {
            execSync('pm2 restart 0');
        }, 1e3)
    }
}