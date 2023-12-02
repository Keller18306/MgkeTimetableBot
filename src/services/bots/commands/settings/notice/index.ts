import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(🔊\s)?(Настройка оповещений|Оповещения)$/i
    public payload = null;
    public scene = 'settings';

    handler({ context, keyboard }: CmdHandlerParams) {
        return context.send('Меню настройки оповещений.', {
            keyboard: keyboard.SettingsNotice
        })
    }
}