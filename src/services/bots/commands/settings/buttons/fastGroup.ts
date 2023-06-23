import { DefaultCommand, HandlerParams } from "../../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_showFastGroup'

    public regexp = /^(✅|🚫)\sКнопка "(👩‍🎓\s)?Группа"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showFastGroup = !chat.showFastGroup

        return context.send(
            `Показывать кнопку "👩‍🎓 Группа"? Установлено: '${chat.showFastGroup ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}