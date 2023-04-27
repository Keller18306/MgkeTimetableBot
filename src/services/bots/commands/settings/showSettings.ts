import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'show_settings'

    public regexp = /^((!|\/)(show|current)Settings)|(Показать текущие)$/i
    public payload = null;

    handler({ context, chat, service }: HandlerParams) {
        return context.send([
            `Показывать кнопку расписания "📄 На день": ${chat.showDaily ? 'да' : 'нет'}`,
            `Показывать кнопку расписания "📑 На неделю": ${chat.showWeekly ? 'да' : 'нет'}`,
            `Показывать кнопку "🕐 Звонки": ${chat.showCalls ? 'да' : 'нет'}`,
            `Показывать кнопку "💡 О боте": ${chat.showAbout ? 'да' : 'нет'}`,
            `Показывать кнопку "👩‍🎓 Группа": ${chat.showFastGroup ? 'да' : 'нет'}`,
            `Показывать кнопку "👩‍🏫 Преподаватель": ${chat.showFastTeacher ? 'да' : 'нет'}`,

            `\nУдалять прошедшие дни в расписании на неделю: ${chat.removePastDays ? 'да' : 'нет'}`,
            `Отображать в сообщении время последней загрузки расписания: ${chat.showParserTime ? 'да' : 'нет'}`,

            `\nОповещение о добавлении нового дня: ${chat.noticeChanges ? 'да' : 'нет'}`,

            ...(service === 'vk' ? [
                '\n__ ТОЛЬКО ВК __:\n',
                `Удалять прошлое сообщения бота о расписании: ${chat.deleteLastMsg ? 'да' : 'нет'}`,
                `Удалять сообщение пользователя после вызова расписания: ${chat.deleteUserMsg ? 'да' : 'нет'}`
            ] : []),

            '\n~~~ Системные (отладочная информация) ~~~',
            `Режим чата: ${chat.mode} (deactivateSecondaryCheck: ${chat.deactivateSecondaryCheck ? 'да' : 'нет'})`,
            `ID последнего сообщения: ${chat.lastMsgId}`,
            `Время последенего сообщения: ${chat.lastMsgTime}`,
            `Разрешено ли отправлять боту сообщения: ${chat.allowSendMess ? 'да' : 'нет'}`,
            `Подписка на рассыку: ${chat.subscribeMess ? 'да' : 'нет'}`,
            `Разрешено ли одобрить VK приложение: ${(service === 'vk' && chat.allowVkAppAccept) ? 'да' : 'нет (возможно уже использовано)'}`,
            `Требуется ли принудительное обновление кнопок: ${chat.needUpdateButtons ? 'да' : 'нет'}`
        ].join('\n'))
    }
}