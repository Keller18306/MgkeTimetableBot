import { AbstractCommand, BotServiceName, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)deleteUserMsg$/i
    public payloadAction = null;

    public services: BotServiceName[] = ['vk']

    async handler({ context, chat, keyboard }: CmdHandlerParams) {
        if (!chat.deleteUserMsg && !context.isChat) return context.send('Это недоступно в ЛС бота')

        if (!chat.deleteUserMsg && !(await context.isChatAdmin()))
            return context.send(
                'Для доступа к этой функции нужно выдать права администатора боту. После выдачи напишите команду ещё раз.\n\n' +
                'Однако даже после выдачи прав администратора бот не сможет удалять сообщения владельца беседы. Это ограничения ВКонтакте.'
            )

        chat.deleteUserMsg = !chat.deleteUserMsg

        return context.send(
            `Удаление сообщения человека, который нажал кнопку для вызова расписания '${chat.deleteUserMsg ? 'включено' : 'выключено'}'`,
            {
                keyboard: keyboard.MainMenu
            }
        )
    }
}