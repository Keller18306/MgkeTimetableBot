import * as fs from 'fs';
import { arch, freemem, loadavg, uptime as osUptime, platform, release, totalmem } from 'os';
import { uptime as botUptime, cpuUsage, memoryUsage, pid, resourceUsage, version, versions } from 'process';
import { cpuTemperature } from 'systeminformation';
import db from "../../../../db";
import { formatBytes } from "../../../../utils/bytes";
import { formatSeconds } from '../../../../utils/seconds2times';
import { DefaultCommand, HandlerParams } from "../../abstract";
import { TelegramBotCommand } from 'puregram/generated';

let latestUsage = cpuUsage()
let latestTime = Date.now()
let percentCpu = 0
setInterval(() => {
    const currentUsage = cpuUsage()
    const currentTime = Date.now()

    const cpuTime = (currentUsage.system - latestUsage.system) + (currentUsage.user - latestUsage.user)

    percentCpu = 100 * cpuTime / ((currentTime - latestTime) * 1000)

    latestUsage = currentUsage
    latestTime = currentTime
}, 3e3)

//const { size: startBdSize } = fs.statSync('./sqlite3.db')

export default class extends DefaultCommand {
    public id = 'debug'

    public regexp = /^(!|\/)debug$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'debug',
        description: 'Вывод отладочной информации'
    };

    public adminOnly: boolean = true;


    async handler({ context }: HandlerParams) {
        const freeMem = freemem()
        const botMemory = memoryUsage()
        const totalMem = totalmem()

        const [cpuTemp, resUsage] = await Promise.all([
            cpuTemperature(),
            resourceUsage()
        ])

        const { size: bdSize } = fs.statSync('./sqlite3.db')

        //TO DO AL CHATS COUNT
        const vk_bot_chats = (db.prepare('SELECT COUNT(*) as `count` FROM `vk_bot_chats`').get() as any).count
        const vk_app_users = (db.prepare('SELECT COUNT(*) as `count` FROM `vk_app_users`').get() as any).count
        const viber_bot_chats = (db.prepare('SELECT COUNT(*) as `count` FROM `viber_bot_chats`').get() as any).count
        const api_keys = (db.prepare('SELECT COUNT(*) as `count` FROM `api`').get() as any).count
        const tg_bot_chats = (db.prepare('SELECT COUNT(*) as `count` FROM `tg_bot_chats`').get() as any).count

        context.send([
            '-- Система --',
            `Температура ЦП: ${cpuTemp.main != null ? `${cpuTemp.main} °C` : 'Н/Д'}`,
            `Занято ОЗУ: ${formatBytes(totalMem - freeMem)}/${formatBytes(totalMem)}`,
            `Средняя нагрузка ЦП: ${loadavg().join(' ')}`,
            `ОС: ${platform()} (${release()}) (${arch()})`,
            `Время работы: ${formatSeconds(osUptime())}`,

            `\n-- Бот --`,
            `PID: ${pid}`,
            `Использование ЦП: ${percentCpu.toFixed(2)}%`,
            `┌ Занято ОЗУ: ${formatBytes(botMemory.rss)}/${formatBytes(resUsage.maxRSS * 1024)}`,
            `├── V8: ${formatBytes(botMemory.external)}`,
            `├── C++: ${formatBytes(botMemory.heapUsed)}/${formatBytes(botMemory.heapTotal)}`,
            `└── Buffers: ${formatBytes(botMemory.arrayBuffers)}`,
            `┌ Размер бота: скоро`,
            `├── Код: скоро`,
            `├── Модули: скоро`,
            `└── SQLite: ${formatBytes(bdSize)}`,
            `┌ Версия NodeJS: ${version}`,
            `├── C++ API: ${versions.modules}`,
            `├── Node API: ${versions.napi}`,
            `├── V8: ${versions.v8}`,
            `├── OpenSSL: ${versions.openssl}`,
            `└── ZLib: ${versions.zlib}`,
            `┌ Диск`,
            `├── Чтений: ${resUsage.fsRead}`,
            `└── Записей: ${resUsage.fsWrite}`,
            `Время работы: ${formatSeconds(Math.floor(botUptime()))}`,

            `\n-- База данных --`,
            `Чатов бота ВК: ${vk_bot_chats}`,
            `Юзеров приложения ВК: ${vk_app_users}`,
            `Чатов бота Viber: ${viber_bot_chats}`,
            `Чатов бота Telegram: ${tg_bot_chats}`,
            `API ключей: ${api_keys}`,
        ].join('\n'))
    }
}