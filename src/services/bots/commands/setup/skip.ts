import { defines } from "../../../../defines";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(🔙\s)?Пропустить$/i
    public payloadAction = null;
    public scene?: string | null = 'setup';

    handler({ context, chat, keyboard, service }: CmdHandlerParams) {
        if (context.isChat) return;

        chat.scene = null;

        context.send(defines[`${service}.message.about`], {
            keyboard: keyboard.MainMenu
        })
    }
}