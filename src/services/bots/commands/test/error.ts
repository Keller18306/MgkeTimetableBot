import { AbstractCommand } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'error'

    public regexp = /^(!|\/)error$/i
    public payload = null;

    async handler() {
        throw new Error('test error')
    }
}