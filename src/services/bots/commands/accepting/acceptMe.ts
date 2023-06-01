import { config } from "../../../../../config";
import db from "../../../../db";
import { FromType, RequestKey } from "../../../../key";
import { DefaultCommand, HandlerParams, Service } from "../../abstract/command";
import { UserData } from '../../../vk_app/user';

const acceptTool = new RequestKey(config.encrypt_key)

export default class extends DefaultCommand {
    public id = 'acceptMe'

    public regexp = /^(!|\/)acceptMe($|\s)/i
    public payload = null;

    public services: Service[] = ['vk'];

    handler({ context, chat, service }: HandlerParams) {
        if (service != 'vk') throw new Error('Service is not vk')

        if (context.isChat) return context.send('Это недоступно в беседах')

        const key = context.text?.replace(this.regexp, '').trim()
        if (key === undefined || key === '') return context.send('Ключ не введён');

        if (!chat.allowVkAppAccept) return context.send('Вы уже активировали приложение')

        const app_user: UserData | undefined = db.prepare('SELECT * FROM `vk_app_users` WHERE `user_id` = ?').get(context.userId) as any
        if (app_user === undefined) return context.send('Вы ещё ниразу не использовали приложение');
        if (app_user.accepted) return context.send('Приложение уже активировано');

        try {
            const parsed = acceptTool.parseKey(key)

            if (parsed.from !== FromType.VKApp) return context.send('Ключ должен быть только из приложения ВК')

            if (parsed.user_id !== context.userId) return context.send('Это не ваш ключ')
        } catch (e) {
            return context.send('Неверный ключ')
        }

        db.prepare('UPDATE `vk_app_users` SET `accepted` = 1 WHERE `user_id` = ?').run(context.userId)
        db.prepare('UPDATE `vk_bot_chats` SET `allowVkAppAccept` = 0 WHERE `peerId` = ?').run(context.userId)

        return context.send('Вы успешно активировали приложение в ВК!')
    }
}