import { TelegramBotCommand } from "puregram/generated";
import { defines } from "../../../defines";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)eula$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand | null = {
        command: 'eula',
        description: 'Лицензионное соглашение'
    };

    handler({ context }: CmdHandlerParams) {
        return context.send(defines.eula);
    }
}