import { z } from "zod";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = null;
    public payload = 'answer';
    public acceptRequired: boolean = true;

    handler({ context }: CmdHandlerParams) {
        const { answer } = z.object({
            answer: z.coerce.string()
        }).parse(context.payload);

        const input = context._input;

        if (input.has(String(context.peerId))) {
            input.resolve(String(context.peerId), answer, 'command');
        } else {
            return context.send('Ничего не найдено');
        }
    }
}