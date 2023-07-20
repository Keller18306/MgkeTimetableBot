import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)context$/i
    public payload = null;

    handler({ context, realContext }: HandlerParams) {
        return context.send(JSON.stringify(realContext, null, 1))
    }
}