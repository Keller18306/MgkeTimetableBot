import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)trigger/i
    public payload = null;

    public adminOnly: boolean = true;

    async handler({ context }: CmdHandlerParams) {
        const [trigger, arg] = context.text?.replace(this.regexp, '').trim().split(' ');

        switch (trigger) {
            case 'NextDayUpdater':
                const index = Number(arg);
                if (isNaN(index)) {
                    return context.send('index is not a number');
                }

                await this.app.getService('bot').cron.execute({ index: index - 1 });

                return context.send('ok');
            default:
                return context.send('not found');
        }
    }
}