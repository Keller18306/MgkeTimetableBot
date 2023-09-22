import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)context$/i
    public payload = null;

    handler({ context, realContext }: CmdHandlerParams) {
        return context.send(JSON.stringify(realContext, null, 1))
    }
}