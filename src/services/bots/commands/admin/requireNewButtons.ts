import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";
import { BotChat } from "../../chat";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)requireNewButtons$/i
    public adminOnly: boolean = true;
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'requireNewButtons',
        description: 'Выставляет метку, что после обращения юзера бот обновит клавиатуру'
    };

    async handler({ context }: CmdHandlerParams) {
        await BotChat.update({
            needUpdateButtons: true
        }, {
            where: {
                accepted: true,
                service: ['vk', 'tg']
            }
        });

        return context.send('ok')
    }
}