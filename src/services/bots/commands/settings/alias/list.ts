import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(⌨️\s)?(Список)$/i
    public payloadAction = null;
    public scene: string  = 'settings_alias';

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        return context.send('Меню настройки алиасов.', {
            keyboard: keyboard.SettingsAliases
        })
    }
}