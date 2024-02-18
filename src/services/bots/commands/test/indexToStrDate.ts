import { StringDate } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(day)?IndexTo(Date|Str(date)?)/i
    public payloadAction = null;

    handler({ context }: CmdHandlerParams) {
        const index: number = +context.text?.replace(this.regexp, '').trim()
        if (isNaN(+index)) return context.send('Индекс дня не число');

        return context.send(StringDate.fromDayIndex(index).toString());
    }
}