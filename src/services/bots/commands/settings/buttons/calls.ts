import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(✅|🚫)\sКнопка "(🕐\s)?Звонки"$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        chat.showCalls = !chat.showCalls

        return context.send(
            `Показывать кнопку "🕐 Звонки"? Установлено: '${chat.showCalls ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsButtons
            }
        )
    }
}