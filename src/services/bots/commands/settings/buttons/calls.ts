import { DefaultCommand, HandlerParams } from "../../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_showCalls'

    public regexp = /^(✅|🚫)\sКнопка "(🕐\s)?Звонки"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showCalls = !chat.showCalls

        return context.send(
            `Показывать кнопку "🕐 Звонки"? Установлено: '${chat.showCalls ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}