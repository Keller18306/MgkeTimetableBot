import { config } from "../../../../../config";
import { AppServiceName } from "../../../../app";
import db from "../../../../db";
import { KeyData } from "../../../api/key";
import { ApiKey } from "../../../key";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

const keyTool = new ApiKey(config.encrypt_key);

export default class extends AbstractCommand {
    public regexp = /^(!|\/)createApi(Key|Token)/i
    public payload = null;
    public adminOnly: boolean = true;
    public requireServices: AppServiceName[] = ['api'];

    handler({ context }: CmdHandlerParams) {
        const args = context.text.split(' ');

        const service: string | undefined = args[1];
        const fromId: string | undefined = args[2];
        let limit: string | undefined = args[3];

        if (!service || !fromId) {
            return context.send([
                'Создать апи токен:',
                `${args[0]} <service> <fromId> [limit]`,
            ].join('\n'));
        }

        if (!limit) {
            limit = String(2);
        }

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
            `Апи токен создан (${recreate ? 'пересоздан' : 'новый'})`,
            `ID: ${id}`,
            `Ключ: ${key.key}`,
            `Лимит: ${limit}`,
            `IV: ${key.iv}`
        ].join('\n'));
    }
}