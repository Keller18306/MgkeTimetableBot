import { TelegramBotCommand } from "puregram/generated";
import db from "../../../../db";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'requireNewButtons'

    public adminOnly: boolean = true;
    public regexp = /^(!|\/)requireNewButtons$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'requireNewButtons',
        description: 'Выставляет метку, что после обращения юзера бот обновит клавиатуру'
    };

    handler({ context, chat, keyboard }: HandlerParams) {
        db.prepare("UPDATE chat_options SET `needUpdateButtons` = 1 WHERE `accepted` = 1 AND `service` IN ('vk', 'tg')").run();

        return context.send('ok')
    }
}