import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)test$/i
    public payloadAction = null;

    handler({ context }: CmdHandlerParams) {
        return;
    }
}