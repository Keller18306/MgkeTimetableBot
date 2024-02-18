import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public payloadAction: string = 'cancel';

    async handler({ context, chat }: CbHandlerParams) {
        context.cancelInput();
        chat.scene = null;

        await context.answer('Ввод был отменён').catch(() => { });
        await context.delete().catch(() => { });
    }
}