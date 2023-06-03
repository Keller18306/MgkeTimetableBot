import { DefaultCommand, HandlerParams } from "../../abstract";
import { defines } from "../../../../defines";
import { TelegramBotCommand } from "puregram/generated";

export default class extends DefaultCommand {
    public id = 'about'

    public regexp = /^((!|\/)(get)?about|(💡\s)?О боте)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'about',
        description: 'О боте и его создателе'
    };

    handler({ context, service }: HandlerParams) {
        return context.send(defines[`${service}.message.about`], { disable_mentions: true })
    }
}