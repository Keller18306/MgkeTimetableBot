import fs from 'fs';
import { TelegramBotCommand } from 'puregram/generated';
import db from '../../../../db';
import { formatBytes } from '../../../../utils';
import { DefaultCommand, HandlerParams } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'admin_vacuum'
    public regexp = /^(!|\/)vacuum/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'vacuum',
        description: 'Сжать базу данных'
    };

    async handler({ context }: HandlerParams) {
        const { size: bdSize_before } = fs.statSync('./sqlite3.db')

        db.prepare('VACUUM;').run();

        const { size: bdSize_after } = fs.statSync('./sqlite3.db')

        return context.send(`Бд сжата: ${formatBytes(bdSize_before)} -> ${formatBytes(bdSize_after)}`);
    }
}