import { AbstractAction } from "../abstract";
import { BotChat as chat } from "../chat";
import { ViberCommandContext } from "./context";

export class ViberAction extends AbstractAction {
    protected context: ViberCommandContext;
    protected chat: chat;

    constructor(context: ViberCommandContext, options: chat) {
        super();

        this.context = context;
        this.chat = options;
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