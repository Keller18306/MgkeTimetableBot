import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'get_id'

    public regexp = /^(!|\/)id$/i
    public payload = null;

    handler({ context }: HandlerParams) {
        context.send([
            `peer_id: ${context.peerId}`,
            `user_id: ${context.userId}`
        ].join('\n'))
    }
}