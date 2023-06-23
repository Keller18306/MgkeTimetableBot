import { DefaultCommand, HandlerParams } from "../../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_showAbout'

    public regexp = /^(✅|🚫)\sКнопка "(💡\s)?О боте"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showAbout = !chat.showAbout

        return context.send(
            `Показывать кнопку "💡 О боте"? Установлено: '${chat.showAbout ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}