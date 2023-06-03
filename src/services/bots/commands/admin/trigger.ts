import { NextDayUpdater } from "../../../../updater/nextDay";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'trigger'

    public regexp = /^(!|\/)trigger/i
    public payload = null;

    public adminOnly: boolean = true;

    async handler({ context, chat }: HandlerParams) {
        const [trigger, arg] = context.text?.replace(this.regexp, '').trim().split(' ');

        switch (trigger) {
            case 'NextDayUpdater':
                const index = Number(arg)
                if (isNaN(index)) {
                    return context.send('index is not a number')
                }
                
                await NextDayUpdater.onExecute(index - 1)

                return context.send('ok')
            default:
                return context.send('not found')
        }
    }
}