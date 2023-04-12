import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'get_context'

    public regexp = /^(!|\/)context$/i
    public payload = null;

    handler({ context, realContext }: HandlerParams) {
        return context.send(JSON.stringify(realContext, null, 1))
    }
}