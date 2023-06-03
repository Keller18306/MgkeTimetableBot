import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_noticeChanges'

    public regexp = /^(🔇|🔈)\sОповещение о новых днях\:\s(да|нет)$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.noticeChanges = !chat.noticeChanges

        return context.send(
            `Оповещение о добавлении нового дня: ${chat.noticeChanges ? 'включено' : 'выключено'}`,
            {
                keyboard: keyboard.Settings
            }
        )
    }
}