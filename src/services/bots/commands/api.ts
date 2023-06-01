import { config } from "../../../../config";
import db from "../../../db";
import { ApiKey } from "../../../key";
import { KeyData } from "../../api/key";
import { DefaultCommand, HandlerParams } from "../abstract/command";

const keyTool = new ApiKey(config.encrypt_key);

export default class extends DefaultCommand {
    public id = 'api'
    public regexp = /^(!|\/)api$/i
    public payload = null;

    handler({ context, service }: HandlerParams) {
        if (context.isChat) return context.send('Команда недоступна в беседах')

        const fromId: string = String(context.peerId);
        let limit: string | undefined = String(2);

        const _key: KeyData = db.prepare('SELECT * FROM `api` WHERE `service` = ? AND `fromId` = ?').get(service, fromId) as any;

        let recreate: boolean;
        let id: number
        if (_key) {
            recreate = true;
            id = _key.id
            limit = String(_key.limitPerSec)
        } else {
            recreate = false;

            const res = db.prepare(
                'INSERT INTO `api` (`service`, `fromId`, `limitPerSec`) VALUES (?, ?, ?)'
            ).run(service, fromId, limit);

            id = Number(res.lastInsertRowid)
        }

        const key = keyTool.createKey(id);

        db.prepare('UPDATE `api` SET `iv` = ? WHERE `id` = ?').run(key.iv, id);

        return context.send([
            `${recreate ? 'Новый ' : ''}API токен #${id} создан:`,
            key.key,
            '\nДокументация: https://vk.com/@mgke_slave-api'
        ].join('\n'));
    }
}