import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'settings_showFastTeacher'

    public regexp = /^(✅|🚫)\sКнопка "(👩‍🏫\s)?Преподаватель"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showFastTeacher = !chat.showFastTeacher

        return context.send(
            `Показывать кнопку "👩‍🏫 Преподаватель"? Установлено: '${chat.showFastTeacher ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.Settings
            }
        )
    }
}