import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)id$/i
    public payload = null;

    handler({ context }: HandlerParams) {
        return context.send([
            `peer_id: ${context.peerId}`,
            `user_id: ${context.userId}`
        ].join('\n'))
    }
}