import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(🖼️\s)?(Отображение)$/i
    public payload = null;
    public scene = 'settings';

    handler({ context, keyboard }: CmdHandlerParams) {
        return context.send('Меню настройки отображения внешнего вида расписания.', {
            keyboard: keyboard.SettingsView
        })
    }
}