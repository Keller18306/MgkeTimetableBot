import { TelegramBotCommand } from 'puregram/generated';
import { vanish } from '../../../../db';
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(vacuum|vanish)/i
    public payloadAction = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'vanish',
        description: 'Почистить базу данных'
    };

    async handler({ context }: CmdHandlerParams) {
        await vanish(this.app);

        return context.send('Бд почищена');
    }
}