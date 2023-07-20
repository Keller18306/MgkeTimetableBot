import { AbstractCommand, HandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(✅|🚫)\sКнопка "(📑\s)?На неделю"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showWeekly = !chat.showWeekly

        return context.send(
            `Показывать кнопку "📑 На неделю"? Установлено: '${chat.showWeekly ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}