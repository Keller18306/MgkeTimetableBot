import { DefaultCommand, HandlerParams, Service } from "../../abstract";

export default class extends DefaultCommand {
    public id = 'settings_deleteLastMsg'

    public regexp = /^(!|\/)deleteLastMsg$/i
    public payload = null;

    public services: Service[] = ['vk'];

    handler({ context, chat, keyboard }: HandlerParams) {
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