type DayCall = [[string, string], [string, string]];
type DayCallShort = [string, string];

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
        syncMode: boolean,
        localMode: boolean,
        ignoreHash: boolean,
        end_hour: number,
        activity: [number, number],
        update_interval: {
            default: number,
            activity: number,
            error: number,
            teams: number
        },
        lessonIndexIfEmpty: number,
        endpoints: {
            timetableGroup: string
            timetableTeacher: string
            team: string[]
        }
    },
    timetable: {
        weekdays: DayCall[],
        saturday: DayCall[],
        shortened: DayCallShort[]
    },
    encrypt_key: Buffer,
    globalNoticer: boolean,
    globalAdblock: boolean
}