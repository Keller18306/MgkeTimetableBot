import { AbstractBot, AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)acceptBot($|\s)/i
    public payloadAction = null;

    public adminOnly: boolean = true;

    async handler({ context, service }: CmdHandlerParams) {
        let peerId: string | undefined | number = context.text?.replace(this.regexp, '').trim() || context.peerId;
        if (isNaN(+peerId)) {
            return context.send('это не число');
        }

        const botService: AbstractBot = this.app.getService(service);
        const chat = await botService.getChat(peerId);

        await chat.update({ accepted: true });

        return context.send([
            `ok:${peerId}`,
            JSON.stringify(chat.toJSON(), null, 4)
        ].join('\n'));
    }
}