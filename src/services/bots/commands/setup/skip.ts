import { defines } from "../../../../defines";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'modeSkip'

    public regexp = /^(🔙\s)?Пропустить$/i
    public payload = null;
    public scene?: string | null = 'setup';

    handler({ context, chat, keyboard, service }: HandlerParams) {
        if (context.isChat) return;

        chat.scene = null;

        context.send(defines[`${service}.message.about`], {
            keyboard: keyboard.MainMenu
        })
    }
}