import { AppServiceName } from "../../../../app";
import { GoogleUser } from "../../../google/models/user";
import { AbstractCommand, ButtonType, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(g(oogle)?)?calendar$/i
    public payloadAction = null;
    public requireServices: AppServiceName[] = ['google'];

    async handler({ context, chat, service, keyboard }: CmdHandlerParams) {
        const google = this.app.getService('google');

        if (!chat.googleEmail) {
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

        const user = await GoogleUser.getByEmail(chat.googleEmail);

        //recheck account
        await user.getApi().getAuth().getAccessToken();

        return context.send([
            `Привязанный гугл аккаунт: ${chat.googleEmail}.`,
            'Действие с календарями:'
        ].join('\n'), {
            keyboard: keyboard.getKeyboardBuilder('GoogleAuth', true).add({
                type: ButtonType.Callback,
                text: 'Список',
                payload: {}
            }).row().add({
                type: ButtonType.Callback,
                text: 'Добавить',
                payload: {}
            }).add({
                type: ButtonType.Callback,
                text: 'Удалить',
                payload: {}
            })
        })
    }
}