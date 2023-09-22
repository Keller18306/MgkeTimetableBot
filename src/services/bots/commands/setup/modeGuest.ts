import { defines } from "../../../../defines";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(👀\s)?Гость$/i
    public payload = null;
    public scene?: string | null = 'setup';

    async handler({ context, chat, keyboard, service }: CmdHandlerParams) {
        chat.mode = 'guest'
        chat.scene = null;
        chat.deactivateSecondaryCheck = false;

        context.send(defines[`${service}.message.about`], {
            keyboard: keyboard.MainMenu
        })
    }
}