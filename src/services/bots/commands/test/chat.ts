import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'get_chat'

    public regexp = /^(!|\/)chat$/i
    public payload = null;

    handler({ context, chat }: HandlerParams) {
        return context.send(JSON.stringify(chat, null, 1))
    }
}