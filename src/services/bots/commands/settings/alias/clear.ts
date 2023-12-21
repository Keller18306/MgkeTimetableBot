import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(⌨️\s)?(Отчистить все)$/i
    public payload = null;
    public scene: string  = 'settings_alias';

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        return context.send('Меню настройки алиасов.', {
            keyboard: keyboard.SettingsAliases
        })
    }
}