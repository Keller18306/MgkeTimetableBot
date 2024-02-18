import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)chat$/i
    public payloadAction = null;

    handler({ context, chat }: CmdHandlerParams) {
        return context.send(JSON.stringify(chat, null, 1))
    }
}