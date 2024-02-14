import { z } from "zod";
import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'answer';
    public acceptRequired: boolean = true;

    async handler({ context }: CbHandlerParams) {
        const { answer } = z.object({
            answer: z.coerce.string()
        }).parse(context.payload);

        await context.answer(`Выбрано: "${answer}"`).catch(() => { });

        const input = context._input;

        if (input.has(String(context.peerId))) {
            input.resolve(String(context.peerId), answer, 'callback');
        }
    }
}