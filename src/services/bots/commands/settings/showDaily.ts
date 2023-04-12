import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'settings_showDaily'

    public regexp = /^(✅|🚫)\sКнопка "(📄\s)?На день"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showDaily = !chat.showDaily

        return context.send(
            `Показывать кнопку "📄 На день"? Установлено: '${chat.showDaily ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.Settings
            }
        )
    }
}