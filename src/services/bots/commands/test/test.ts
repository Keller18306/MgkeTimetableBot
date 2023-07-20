import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'test'

    public regexp = /^(!|\/)test$/i
    public payload = null;

    handler({ context }: HandlerParams) {
        return;
    }
}