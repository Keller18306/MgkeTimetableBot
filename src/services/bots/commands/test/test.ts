import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)test$/i
    public payload = null;

    handler({ context }: CmdHandlerParams) {
        return;
    }
}