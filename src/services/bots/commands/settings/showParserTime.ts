import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(✅|🚫)\sВремя последней загрузки расписания$/i
    public payload = null;
    public scene?: string | null = 'settings';

    handler({ context, chat, keyboard }: HandlerParams) {
        chat.showParserTime = !chat.showParserTime

        return context.send(
            `Отображать в сообщении время последней загрузки расписания? Установлено: '${chat.showParserTime ? 'да' : 'нет'}'`,
            {
                keyboard: keyboard.SettingsMain
            }
        )
    }
}