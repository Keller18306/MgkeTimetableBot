import { TelegramBotCommand } from "puregram/generated";
import { defines } from "../../../../defines";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)(get)?about|(💡\s)?О боте)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'about',
        description: 'О боте и его создателе'
    };

    handler({ context, service }: CmdHandlerParams) {
        return context.send(defines[`${service}.message.about`], { disable_mentions: true })
    }
}