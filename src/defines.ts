const globalLinks: string = 'Небольшая статья, как настроить бота: https://vk.com/@mgke_slave-ispolzovanie-bota\n\n' +
    'Статья для преподавателей: https://vk.com/@mgke_slave-ispolzovanie-bota?anchor=dlya-uchiteley\n\n' +
    'Исходный код: https://github.com/Keller18306/MgkeTimetableBot';

export const defines: {
    [key: string]: string
} = {
    'global.links': globalLinks,

    'vk.message.about': 'Бот был создан [id290331922|Алексеем Костюком] из группы 63ТП. Для сообщения о багах или запроса функционала писать ему.\n\n' +
        `${globalLinks}\n\n` +
        'Отключить/включить кнопку "О боте" можно в настройках.',

    'viber.message.about': 'Бот был создан Алексеем Костюком из группы 63ТП. Для сообщения о багах или запроса функционала писать ему в вк: https://vk.com/keller18306.\n\n' +
        `${globalLinks}\n\n` +
        'Отключить/включить кнопку "О боте" можно в настройках.',

    'tg.message.about': 'Бот был создан Алексеем Костюком из группы 63ТП. Для сообщения о багах или запроса функционала писать ему в тг: @keller18306.\n\n' +
        `${globalLinks}\n\n` +
        'Отключить/включить кнопку "О боте" можно в настройках.',

    'need.accept': 'У вас нет доступа, чтобы использовать бота.\n\n' +
        'Для получения доступа писать ему: [id290331922|Костюк Алексей]\n\n' +
        'Ключ, который нужно предоставить:\n%s',

    'success.accept': `Доступ был успешно получен.\n\n${globalLinks}`,

    'not.accepted': 'Доступ ещё не был выдан.\n\n' +
        'Для получения доступа писать ему: [id290331922|Костюк Алексей]\n\n' +
        'Ключ, который нужно предоставить:\n%s',

    'viber.first.message': 'Добро пожаловать!\nЭто бот для получения расписания уроков с сайта МГКЦТ. Для того, чтобы продолжить, нажмите на кнопку "Начать" ниже.',

    'eula': [
        '⚠️ Обратите внимание ⚠️',
        'Бот НЕ ЯВЛЯЕТСЯ официальным бота колледжа. Используя бота, вы принимаете, что информация, предоставленная ботом, может не соответствовать предоставленной на сайте или вовсе быть ошибочной. Разработчик за любые ошибки ответственности не несёт. (при ошибках можете сообщать разработчику и они будут своевременно исправлены)',
        'Также разработчик имеет полное право ограничить или же закрыть доступ к боту в любой момент без предупреждения. Доступ к боту предоставляется на безвозмездной основе со стороны разработчика.',
        'Продолжая использовать бота вы подтверждаете, что согласны с данными условиями.'
    ].join('\n\n')
}

export const hints: string[] = [
    'Настроить оповещения можно в настройках (/settings)',
    'Не нравится вид расписания? Попробуй новый в настройках! (/settings -> Форматировщик)',
    'Мешают лишние кнопки? Убери их в настройках! (/settings)',
    'Установил не ту группу или учителя? Измени в настройках! (/settings -> Первоначальная настройка)',
    'Ты разработчик? Имеешь навыки в программировании на TypeScript? Сделай бота лучше! (/dev)',
    'Проблема с ботом? Не бойся писать разработчику (/about)',
    'Вопрос по боту? Не бойся спросить у разработчика (/about)',
    'Мешают подсказки? Убери в настройках! (/settings)',
    'Хочешь интегрировать расписание в свой проект? У бота есть API! (/api)'
];