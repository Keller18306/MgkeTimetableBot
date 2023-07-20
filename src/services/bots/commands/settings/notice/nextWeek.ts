import { DefaultCommand, HandlerParams } from "../../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_noticeNextWeek'

    public regexp = /^(🔇|🔈)\sОповещение о новой недел(е|и)(\:\s(да|нет))?$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.noticeNextWeek = !chat.noticeNextWeek

        return context.send(
            `Оповещение о добавлении новой недели: ${chat.noticeNextWeek ? 'включено' : 'выключено'}`,
            {
                keyboard: keyboard.SettingsMain
            }
        )
    }
}