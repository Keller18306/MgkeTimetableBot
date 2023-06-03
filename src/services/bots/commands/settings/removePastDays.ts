import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_removePastDays'

    public regexp = /^(✅|🚫)\sУдалять прошедшие дни$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.removePastDays = !chat.removePastDays;

        return context.send(
            `Удалять прошедшие дни? Установлено: '${chat.removePastDays ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.Settings
            }
        )
    }
}