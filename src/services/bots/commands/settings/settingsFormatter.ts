import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(📃\s)?(Настройка форматировщика|Форматировщик)$/i
    public payload = null;
    public scene = 'settings';

    handler({ context, keyboard }: HandlerParams) {
        return context.send('Меню настройки форматировщика.', {
            keyboard: keyboard.SettingsFormatters
        });
    }
}