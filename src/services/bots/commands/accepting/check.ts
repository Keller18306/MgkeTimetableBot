import { format } from "util";
import { config } from "../../../../../config";
import { defines } from "../../../../defines";
import { FromType, RequestKey } from "../../../../key";
import { AbstractCommand, CmdHandlerParams, Service } from "../../abstract";
import { StaticKeyboard } from "../../keyboard";

const acceptTool = new RequestKey(config.encrypt_key)

export default class extends AbstractCommand {

    public acceptRequired: boolean = false;
    public regexp = /^Проверить$/i
    public payload = null;

    public services: Service[] = ['vk'];

    handler({ context, chat, keyboard, service }: CmdHandlerParams) {
        if (service != 'vk') throw new Error('is not vk')

        if (!chat.accepted) return context.send(format(defines['not.accepted'],
            acceptTool.getKey({
                from: FromType.VKBot,
                peer_id: context.peerId,
                sender_id: context.userId,
                time: Date.now()
            })
        ), {
            disable_mentions: true,
            keyboard: StaticKeyboard.NeedAccept
        })

        return context.send(defines['success.accept'], {
            disable_mentions: true,
            keyboard: keyboard.MainMenu
        })
    }
}