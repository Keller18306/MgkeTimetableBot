export abstract class AbstractAction {
    protected abstract context: any;
    protected abstract chat: any;

    public abstract deleteLastMsg(): Promise<boolean>

    public abstract deleteUserMsg(): Promise<boolean>

    public abstract handlerLastMsgUpdate(context: any): Promise<boolean>
}