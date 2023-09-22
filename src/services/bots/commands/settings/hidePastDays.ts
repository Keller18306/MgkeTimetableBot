import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(✅|🚫)\sСкрывать прошедшие дни$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.hidePastDays = !chat.hidePastDays;

        return context.send(
            `Скрывать прошедшие дни? Установлено: '${chat.hidePastDays ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsMain
            }
        )
    }
}