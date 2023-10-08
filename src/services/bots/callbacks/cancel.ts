import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'cancel';

    async handler({ context, chat }: CbHandlerParams) {
        const input = context._input;

        input.cancel(String(context.peerId));
        chat.scene = null;

        await context.answer('Ввод был отменён').catch(() => { });
        await context.delete().catch(() => { });
    }
}