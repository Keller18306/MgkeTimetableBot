import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)chat$/i
    public payload = null;

    handler({ context, chat }: CmdHandlerParams) {
        return context.send(JSON.stringify(chat, null, 1))
    }
}