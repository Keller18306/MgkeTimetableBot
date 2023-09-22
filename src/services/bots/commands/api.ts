import { config } from "../../../../config";
import db from "../../../db";
import { ApiKey } from "../../../key";
import { formatDateTime } from "../../../utils";
import { KeyData } from "../../api/key";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

const keyTool = new ApiKey(config.encrypt_key);

export default class extends AbstractCommand {
    public regexp = /^(!|\/)api(_new)?$/i
    public payload = null;

    handler({ context, service }: CmdHandlerParams) {
        if (context.isChat) return context.send('Команда недоступна в беседах');

        let limit: number = 2;

        let key: KeyData | null = db.prepare('SELECT * FROM `api` WHERE `service` = ? AND `fromId` = ?').get(service, context.peerId) as any;
        if (!key) {
            const res = db.prepare(
                'INSERT INTO `api` (`service`, `fromId`, `limitPerSec`) VALUES (?, ?, ?)'
            ).run(service, context.peerId, limit);

            key = db.prepare('SELECT * FROM `api` WHERE `id` = ?').get(res.lastInsertRowid) as KeyData;
        } else {
            limit = key.limitPerSec;
        }

        if (!key.iv || context.text.endsWith('_new')) {
            key.iv = keyTool.createStringIV();
            db.prepare('UPDATE `api` SET `iv` = ? WHERE `id` = ?').run(key.iv, key.id);
        }

        return context.send([
            `${context.text.endsWith('_new') ? 'Новый ' : ''}API токен #${key.id}:`,
            keyTool.getKey(key.id, key.iv),
            `Запросов в сек: ${key.limitPerSec}`,
            `Последнее использование: ${key.last_time ? formatDateTime(new Date(key.last_time)) : 'нет'}`,

            '\nДокументация: https://vk.com/@mgke_slave-api',
            'Создать новый: /api_new'
        ].join('\n'));
    }
}