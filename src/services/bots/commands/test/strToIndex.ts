import { DayIndex } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(date|str(Date)?)To(Day)?Index/i
    public payloadAction = null;

    handler({ context }: CmdHandlerParams) {
        const day = context.text?.replace(this.regexp, '').trim()
        if (day === undefined) return context.send('День не введён');

        return context.send(DayIndex.fromStringDate(day).toString());
    }
}