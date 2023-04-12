import { DefaultCommand } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'error'

    public regexp = /^(!|\/)error$/i
    public payload = null;

    async handler() {
        throw new Error('test error')
    }
}