import { AbstractCommand, HandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(✅|🚫)\sКнопка "(📄\s)?На день"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showDaily = !chat.showDaily

        return context.send(
            `Показывать кнопку "📄 На день"? Установлено: '${chat.showDaily ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}