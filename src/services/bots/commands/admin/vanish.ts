import fs from 'fs';
import { TelegramBotCommand } from 'puregram/generated';
import { vanish } from '../../../../db';
import { formatBytes } from '../../../../utils';
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
        const { size: bdSize_before } = fs.statSync('./sqlite3.db')

        vanish(this.app);

        const { size: bdSize_after } = fs.statSync('./sqlite3.db')

        const bdSize_delta: number = bdSize_after - bdSize_before;

        return context.send(`Бд почищена (${formatBytes(bdSize_delta)}): ${formatBytes(bdSize_before)} -> ${formatBytes(bdSize_after)}`);
    }
}