import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'answer';

    async handler({ context, chat }: CbHandlerParams) {
        const answer: string = context.payload.answer;
        if (!answer) return;

        await context.answer(`Выбрано: "${answer}"`).catch(() => { });

        const input = context._input;

        if (chat.accepted && input.has(String(context.peerId))) {
            input.resolve(String(context.peerId), answer);

            await context.delete().catch(() => { });
        }
    }
}