import { ConfigScheme } from "./config.scheme";

export const config: ConfigScheme = {
    dev: true,
    services: ['http', 'api', 'timetable', 'parser'],
    db: {
        dialect: 'sqlite',
        storage: 'sqlite3.db'
    },
    http: {
        servername: 'localhost',
        port: 8081
    },
    vk: {
        app: {
            id: 8071219,
            secret: '',
            url: '/vk'
        },
        bot: {
            id: 193708347,
            access_token: '',
            noticer: true
        },
        admin_ids: [290331922]
    },
    viber: {
        name: 'Бот',
        token: '',
        url: '/viber',
        admin_ids: ['DKnlUfGgw2oz4PRTLxQ5+Q=='],
        noticer: true
    },
    telegram: {
        token: '',
        admin_ids: [804594266],
        noticer: true
    },
    api: {
        url: '/api'
    },
    alice: {},
    google: {
        redirectDomain: 'https://mgke.keller.by',
        url: '/google/oauth',
        oauth: {
            clientId: '... .apps.googleusercontent.com',
            clientSecret: ''
        },
        service_account: {
            clientEmail: 'calendar@mgkct-timetable.iam.gserviceaccount.com',
            privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
        },
        calendar_owners: [],
        rateLimitter: { // не более 600 запросов в минуту
            maxRequestsPerInterval: 600,
            interval: 60 * 1e3
        }
    },
    accept: {
        room: false,
        private: true,
        app: true
    },
    parser: {
        enabled: true,
        syncMode: false, // Режим парсинга. false - параллельный (все запросы выполняются одновременно, пирсит быстрее, больше нагружает систему), true - последовательный (все запросы выполняются по очереди, парсит медленнее, меньше нагружает систему)
        localMode: false, // Используется только во время разработки (парсер не делает запросы к сайту, а читает json файл)
        ignoreHash: false,
        end_hour: 17,
        activity: [9, 17],
        update_interval: {
            default: 1 * 60 * 60, // 1 hour
            activity: 30, // 30 sec
            error: 60, // 1 min
            teams: 1 * 24 * 60 * 60 // 1 day
        },
        alertableIgnoreFilter: {
            group: [
                {
                    lesson: 'Уч прак програм',
                    type: 'Пр-ка'
                }
            ],
            teacher: []
        },
        lessonIndexIfEmpty: 2, //Если сегодня пар нет - после данной пары отправятся сообщения людям
        endpoints: {
            timetableGroup: 'https://mgkct.minskedu.gov.by/персоналии/учащимся/расписание-занятий-на-неделю',
            timetableTeacher: 'https://mgkct.minskedu.gov.by/персоналии/преподавателям/расписание-занятий-на-неделю',
            team: [
                'https://mgkct.minskedu.gov.by/о-колледже/администрация-колледжа',
                'https://mgkct.minskedu.gov.by/о-колледже/педагогический-коллектив',
                'https://mgkct.minskedu.gov.by/о-колледже/cлужащие',
                'https://mgkct.minskedu.gov.by/о-колледже/cлужащие-ахч'
            ]
        },
        proxy: null
    },
    timetable: {
        weekdays: [
            [['09:00', '09:45'], ['09:55', '10:40']],
            [['10:50', '11:35'], ['11:55', '12:40']],
            [['13:00', '13:45'], ['13:55', '14:40']],
            [['14:50', '15:35'], ['15:45', '16:30']],
            [['16:40', '17:25'], ['17:35', '18:20']],
            [['18:30', '19:15'], ['19:25', '20:10']]
        ],
        saturday: [
            [['09:00', '09:45'], ['09:55', '10:40']],
            [['10:50', '11:35'], ['11:55', '12:40']],
            [['12:50', '13:35'], ['13:45', '14:30']],
            [['14:40', '15:25'], ['15:35', '16:20']],
            [['16:30', '17:15'], ['17:25', '18:10']],
            [['18:20', '19:05'], ['19:15', '20:00']]
        ],
        shortened_1h: [
            ['09:00', '10:00'],
            ['10:10', '11:10'],
            ['11:20', '12:20'],
            ['12:30', '13:30'],
            ['13:40', '14:40'],
            ['14:50', '15:50']
        ]
    },
    encrypt_key: Buffer.from('', 'base64'), //Ключ шифрования для ключей (API, Запрос на ацепт, и т.д.), можно создать через `crypto.randomBytes(32).toString('base64')`
    globalNoticer: false, // Отключить везде оповещения
    globalAdblock: false // Отключить рекламу в приложениях
}