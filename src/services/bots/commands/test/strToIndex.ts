import { strDateToIndex } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(date|str(Date)?)ToIndex/i
    public payload = null;

    handler({ context }: HandlerParams) {
        const day = context.text?.replace(this.regexp, '').trim()
        if (day === undefined) return context.send('День не введён');

        return context.send(strDateToIndex(day).toString());
    }
}