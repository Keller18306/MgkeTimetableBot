import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'get_chat'

    public regexp = /^(!|\/)chat$/i
    public payload = null;

    handler({ context, chat }: HandlerParams) {
        return context.send(JSON.stringify(chat, null, 1))
    }
}