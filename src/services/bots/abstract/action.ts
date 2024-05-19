import { BotChat } from "../chat";

export abstract class AbstractAction {
    protected abstract context: any;
    protected abstract chat: BotChat;

    public abstract deleteLastMsg(): Promise<boolean>

    public abstract deleteUserMsg(): Promise<boolean>

    public abstract handlerLastMsgUpdate(context: any): Promise<boolean>
}