import { AppServiceName } from "../../../../app";
import { AbstractCommand, ButtonType, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(g(oogle)?)?calendar$/i
    public payload = null;
    public requireServices: AppServiceName[] = ['google'];

    handler({ context, chat, service, keyboard }: CmdHandlerParams) {
        const google = this.app.getService('google');

        if (!chat.google_email) {
            const url = google.getAuthUrl({
                service: service,
                peerId: context.peerId
            });

            return context.send('Гугл аккаунт не привязан, чтобы привязать, нажмите на кнопку ниже', {
                keyboard: keyboard.getKeyboardBuilder('GoogleAuth', true).add({
                    type: ButtonType.Url,
                    text: 'Привязать Google аккаунт',
                    url: url
                })
            });
        }

        return context.send([
            `Привязанный гугл аккаунт: ${chat.google_email}`
        ].join('\n'))
    }
}