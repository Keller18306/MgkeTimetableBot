import { config } from "../../../../config";
import db from "../../../db";
import { FromType, RequestKey } from "../../../key";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

const acceptTool = new RequestKey(config.encrypt_key)

export default class VkAppAcceptKeyMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'acceptKey';

    handler({ user, request, response }: HandlerParams) {
        const bot_cfg = user.getFromBot();

        if(!user.allowBotAccept) return {
            status: 'default',
            message: 'Вы уже активировали бота'
        }

        if(bot_cfg == undefined) return {
            status: 'error',
            message: 'Вы ещё ниразу не использовали бота'
        }

        if (bot_cfg.accepted) return {
            status: 'default',
            message: 'Бот уже активирован'
        }

        try {
            const parsed = acceptTool.parseKey(request.body.key)

            if (parsed.from !== FromType.VKBot) return {
                status: 'error',
                message: 'Это ключ не из бота'
            }

            if (parsed.peer_id === parsed.sender_id) return {
                status: 'error',
                message: 'Для активации беседы нужно писать Разработчику'
            }

            if (parsed.sender_id !== user.vk_id) return {
                status: 'error',
                message: 'Это не ваш ключ'
            }
        } catch (e) {
            return {
                status: 'error',
                message: 'Неверный ключ'
            }
        }
        
        db.prepare('UPDATE `vk_bot_chats` SET `accepted` = 1 WHERE `peer_id` = ?').run(user.vk_id)
        user.allowBotAccept = false

        return {
            status: 'valid',
            message: 'Вы успешно активировали бота!'
        };
    }
}