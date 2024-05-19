import { config } from "../../../../config";
import { AppServiceName } from "../../../app";
import { ApiKey } from "../../../key";
import { StringDate } from "../../../utils";
import { ApiKeyModel } from "../../api/key";
import { AbstractCommand, CmdHandlerParams } from "../abstract";

const keyTool = new ApiKey(config.encrypt_key);

export default class extends AbstractCommand {
    public regexp = /^(!|\/)api(_new)?$/i
    public payloadAction = null;
    public requireServices: AppServiceName[] = ['api'];

    async handler({ context, chat, formatter }: CmdHandlerParams) {
        if (context.isChat) {
            return context.send('Команда недоступна в беседах');
        }

        const [key] = await ApiKeyModel.findOrCreate({
            defaults: { chatId: chat.id },
            where: { chatId: chat.id }
        });

        if (context.text.endsWith('_new')) {
            await key.renewIV();
        }

        return context.send([
            `${context.text.endsWith('_new') ? 'Новый ' : ''}API токен #${key.id}:`,
            formatter.m(keyTool.getKey(key.id, key.iv)),
            `Запросов в сек: ${key.limitPerSec}`,
            `Последнее использование: ${key.lastUsed ? StringDate.fromDate(key.lastUsed).toStringDateTime() : 'нет'}`,

            '\nДокументация: https://vk.com/@mgke_slave-api',
            'Создать новый: /api_new'
        ].join('\n'));
    }
}