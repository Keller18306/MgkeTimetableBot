import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'test'

    public regexp = /^(!|\/)test$/i
    public payload = null;

    handler({ context }: HandlerParams) {
        return;
    }
}