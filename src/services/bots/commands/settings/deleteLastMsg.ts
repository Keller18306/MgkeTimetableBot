import { AbstractCommand, CmdHandlerParams, Service } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)deleteLastMsg$/i
    public payload = null;

    public services: Service[] = ['vk'];

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        if (!chat.deleteLastMsg && !context.isChat) return context.send('Это недоступно в ЛС бота')

        chat.deleteLastMsg = !chat.deleteLastMsg

        return context.send(
            `Удаление последнего сообщения от бота с раписанием '${chat.deleteLastMsg ? 'включено' : 'выключено'}'`,
            {
                keyboard: keyboard.MainMenu
            }
        )
    }
}