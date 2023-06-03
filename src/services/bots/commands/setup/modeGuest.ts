import { defines } from "../../../../defines";
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'modeGuest'

    public regexp = /^(👀\s)?Гость$/i
    public payload = null;
    public scene?: string | null = 'setup';

    async handler({ context, chat, keyboard, service }: HandlerParams) {
        chat.mode = 'guest'
        chat.scene = null;
        chat.deactivateSecondaryCheck = false;

        context.send(defines[`${service}.message.about`], {
            keyboard: keyboard.MainMenu
        })
    }
}