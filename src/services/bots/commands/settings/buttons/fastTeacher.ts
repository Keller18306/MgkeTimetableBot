import { AbstractCommand, HandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public id = 'settings_showFastTeacher'

    public regexp = /^(✅|🚫)\sКнопка "(👩‍🏫\s)?Преподаватель"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showFastTeacher = !chat.showFastTeacher

        return context.send(
            `Показывать кнопку "👩‍🏫 Преподаватель"? Установлено: '${chat.showFastTeacher ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}