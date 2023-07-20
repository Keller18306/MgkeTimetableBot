import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public id = 'get_settings_buttons'

    public regexp = /^(⌨️\s)?(Настройка кнопок|Кнопки)$/i
    public payload = null;
    public scene = 'settings';

    handler({ context, keyboard }: HandlerParams) {
        return context.send('Меню настройки кнопок.', {
            keyboard: keyboard.SettingsButtons
        })
    }
}