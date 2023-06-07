import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_hidePastDays'

    public regexp = /^(✅|🚫)\sСкрывать прошедшие дни$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.hidePastDays = !chat.hidePastDays;

        return context.send(
            `Скрывать прошедшие дни? Установлено: '${chat.hidePastDays ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.Settings
            }
        )
    }
}