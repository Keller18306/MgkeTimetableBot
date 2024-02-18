import { AbstractCommand } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)error$/i
    public payloadAction = null;

    async handler() {
        throw new Error('test error')
    }
}