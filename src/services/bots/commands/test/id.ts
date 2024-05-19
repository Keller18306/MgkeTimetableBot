import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)id$/i
    public payloadAction = null;

    handler({ chat, context }: CmdHandlerParams) {
        return context.send([
            `chat_id: ${chat.id}`,
            `peer_id: ${context.peerId}`,
            `user_id: ${context.userId}`
        ].join('\n'))
    }
}