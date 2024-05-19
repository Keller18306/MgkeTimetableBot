import { z } from "zod";
import { config } from "../../../../../config";
import { AppServiceName } from "../../../../app";
import { ApiKey } from "../../../../key";
import { ApiKeyModel } from "../../../api/key";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

const keyTool = new ApiKey(config.encrypt_key);

export default class extends AbstractCommand {
    public regexp = /^(!|\/)createApi(Key|Token)/i
    public payloadAction = null;
    public adminOnly: boolean = true;
    public requireServices: AppServiceName[] = ['api'];

    async handler({ context }: CmdHandlerParams) {
        const args = context.text.trim().split(' ');

        const result = z.tuple([
            z.coerce.number(),
            z.coerce.number().optional()
        ]).safeParse(args);

        if (!result.success) {
            return context.send([
                'Создать апи токен:',
                `${args[0]} <chatId> [limit]`,
            ].join('\n'));
        }

        const [chatId, limit] = result.data;

        const [key, created] = await ApiKeyModel.findOrCreate({
            defaults: { chatId: chatId, limitPerSec: limit },
            where: { chatId: chatId }
        });

        if (!created) {
            await key.renewIV();
        }

        return context.send([
            `Апи токен создан (${created ? 'добавлен' : 'обновлён'})`,
            `ID: ${key.id}`,
            `Ключ: ${key.getApiKey()}`,
            `Лимит: ${key.limitPerSec}`,
            `IV: ${key.iv.toString('base64url')}`
        ].join('\n'));
    }
}