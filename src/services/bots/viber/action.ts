import { AbstractAction } from "../abstract/action";
import { ViberChat } from "./chat";
import { ViberCommandContext } from "./context";

export class ViberAction extends AbstractAction {
    protected context: ViberCommandContext;
    protected chat: ViberChat;

    constructor(context: ViberCommandContext, chat: ViberChat) {
        super()
        this.context = context
        this.chat = chat
    }

    async deleteLastMsg() {
        return false;
    }

    async deleteUserMsg() {
        return false;
    }

    async handlerLastMsgUpdate() {
        return false;
    }
}