import * as fs from 'fs';
import { arch, freemem, loadavg, uptime as osUptime, platform, release, totalmem } from 'os';
import { uptime as botUptime, cpuUsage, memoryUsage, pid, resourceUsage, version, versions } from 'process';
import { TelegramBotCommand } from 'puregram/generated';
import { cpuTemperature } from 'systeminformation';
import { getAllowSendMessCount, getRowsCountInTable } from "../../../../db";
import { formatBytes, formatSeconds } from "../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

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

export default class extends AbstractCommand {
    public regexp = /^(!|\/)debug$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'debug',
        description: 'Вывод отладочной информации'
    };

    public adminOnly: boolean = true;

    async handler({ context }: CmdHandlerParams) {
        const freeMem = freemem();
        const botMemory = memoryUsage();
        const totalMem = totalmem();

        const [cpuTemp, resUsage] = await Promise.all([
            cpuTemperature(),
            resourceUsage()
        ]);

        const { size: bdSize } = fs.statSync('./sqlite3.db');

        const vkBotChats = getRowsCountInTable('vk_bot_chats');
        const vkBotChatsAllowed = getAllowSendMessCount('vk');
        const vkAppUsers = getRowsCountInTable('vk_app_users');
        const viberBotChats = getRowsCountInTable('viber_bot_chats');
        const viberBotChatsAllowed = getAllowSendMessCount('viber');
        const apiKeys = getRowsCountInTable('api');
        const tgBotChats = getRowsCountInTable('tg_bot_chats');
        const tgBotChatsAllowed = getAllowSendMessCount('tg');

        return context.send([
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
            `Чатов бота ВК: ${vkBotChats} (${vkBotChatsAllowed})`,
            `Юзеров приложения ВК: ${vkAppUsers}`,
            `Чатов бота Viber: ${viberBotChats} (${viberBotChatsAllowed})`,
            `Чатов бота Telegram: ${tgBotChats} (${tgBotChatsAllowed})`,
            `API ключей: ${apiKeys}`,
        ].join('\n'));
    }
}