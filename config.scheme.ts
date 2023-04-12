export type ConfigScheme = {
    dev: boolean,
    http: {
        enabled: boolean,
        servername: string,
        port: number
    },
    vk: {
        app: {
            enabled: boolean,
            id: number,
            secret: string,
            url: string
        },
        bot: {
            enabled: boolean,
            id: number,
            access_token: string,
            noticer: boolean
        },
        admin_ids: number[],
    },
    telegram: {
        enabled: boolean,
        token: string,
        admin_ids: number[],
        noticer: boolean
    },
    viber: {
        enabled: boolean,
        name: string,
        token: string,
        url: string,
        admin_ids: string[],
        noticer: boolean
    },
    apk: {
        enabled: boolean
    },
    api: {
        url: string,
        enabled: boolean
    },
    alice: {
        enabled: boolean
    },
    accept: {
        room: boolean,
        private: boolean,
        app: boolean
    },
    updater: {
        enabled: boolean,
        end_hour: number,
        activity: [number, number],
        update_interval: {
            default: number,
            activity: number,
            error: number
        },
        lessonIndexIfEmpty: number
    },
    timetable: {
        weekdays: [[string, string], [string, string]][],
        saturday: [[string, string], [string, string]][],
    },
    encrypt_key: Buffer,
    parseSyncMode: boolean,
    globalNoticer: boolean,
    globalAdblock: boolean
}