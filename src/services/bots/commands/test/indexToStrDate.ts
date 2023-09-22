import { dayIndexToDate, formatDate } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)indexTo(Date|Str(date)?)/i
    public payload = null;

    handler({ context }: CmdHandlerParams) {
        const index: number = +context.text?.replace(this.regexp, '').trim()
        if (isNaN(+index)) return context.send('Индекс дня не число');

        return context.send(formatDate(dayIndexToDate(index)));
    }
}