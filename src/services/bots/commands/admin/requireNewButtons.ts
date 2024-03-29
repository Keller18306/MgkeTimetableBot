import { TelegramBotCommand } from "puregram/generated";
import db from "../../../../db";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)requireNewButtons$/i
    public adminOnly: boolean = true;
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'requireNewButtons',
        description: 'Выставляет метку, что после обращения юзера бот обновит клавиатуру'
    };

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        db.prepare("UPDATE chat_options SET `needUpdateButtons` = 1 WHERE `accepted` = 1 AND `service` IN ('vk', 'tg')").run();

        return context.send('ok')
    }
}