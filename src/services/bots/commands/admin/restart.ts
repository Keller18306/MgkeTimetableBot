import { execSync } from "child_process";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'restart'

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