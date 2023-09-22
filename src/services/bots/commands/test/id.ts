import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)id$/i
    public payload = null;

    handler({ context }: CmdHandlerParams) {
        return context.send([
            `peer_id: ${context.peerId}`,
            `user_id: ${context.userId}`
        ].join('\n'))
    }
}