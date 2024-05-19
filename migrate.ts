import { App } from './src/app';
import { dbOld, sequelize } from './src/db';
import { ApiKeyModel } from './src/services/api/key';
import { BotChat } from './src/services/bots/chat';
import { StorageModel } from './src/services/bots/storage/model';
import { TgChat } from './src/services/bots/tg/chat';
import { ViberChat } from './src/services/bots/viber/chat';
import { VkChat } from './src/services/bots/vk/chat';
import { TimetableArchive } from './src/services/timetable/models/timetable';
import { VKAppUser } from './src/services/vk_app/user';

// Чтобы создались все ORM модели
new App();

const main = async () => {
    await sequelize.sync({ force: true });

    const sourceIds: any = {};
    const serviceIds: any = {};
    let rows: any[];

    rows = dbOld.prepare("SELECT * FROM chat_options").all();
    await BotChat.bulkCreate(rows.map((row: any, i: number) => {
        const id = i + 1;

        sourceIds[`${row.service}_${row.id}`] = id;

        return Object.assign(row, {
            id: id,
            googleEmail: row.google_email,
            historyGroup: JSON.parse(row.historyGroup),
            historyTeacher: JSON.parse(row.historyTeacher)
        });
    }));

    rows = dbOld.prepare('SELECT * FROM tg_bot_chats').all();
    await TgChat.bulkCreate(rows.map((row: any) => {
        const service = 'tg'
        const chatId = sourceIds[`${service}_${row.id}`];

        serviceIds[`${service}_${row.peerId}`] = chatId;

        return Object.assign(row, {
            chatId: chatId
        });
    }));

    rows = dbOld.prepare('SELECT * FROM vk_bot_chats').all();
    await VkChat.bulkCreate(rows.map((row: any) => {
        const service = 'vk'
        const chatId = sourceIds[`${service}_${row.id}`];

        serviceIds[`${service}_${row.peerId}`] = chatId;

        return Object.assign(row, {
            chatId: chatId
        });
    }));

    rows = dbOld.prepare('SELECT * FROM viber_bot_chats').all();
    await ViberChat.bulkCreate(rows.map((row: any) => {
        const service = 'viber'
        const chatId = sourceIds[`${service}_${row.id}`];

        serviceIds[`${service}_${row.peerId}`] = chatId;

        return Object.assign(row, {
            chatId: chatId
        });
    }));

    rows = dbOld.prepare('SELECT * FROM api').all();
    await ApiKeyModel.bulkCreate(rows.map((row: any) => {
        const chatId = serviceIds[`${row.service}_${row.fromId}`];

        if (chatId === undefined) {
            if (![565633276].includes(row.fromId)) {
                debugger;
            }

            return;
        }

        return Object.assign(row, {
            chatId: chatId,
            lastUsed: row.last_time ? new Date(row.last_time) : null
        });
    }).filter(rows => rows != undefined));

    rows = dbOld.prepare('SELECT * FROM storage').all();
    await StorageModel.bulkCreate(rows.map((row: any) => {
        const time = new Date(row.time * 1000);

        return Object.assign(row, {
            createdAt: time,
            updatedAt: time
        });
    }), {
        silent: true
    } as any);

    rows = dbOld.prepare('SELECT * FROM timetable_archive').all();
    await TimetableArchive.bulkCreate(rows.map((row: any) => {
        return Object.assign(row, {
            id: null
        });
    }))

    rows = dbOld.prepare('SELECT * FROM vk_app_users').all();
    await VKAppUser.bulkCreate(rows.map((row: any) => {
        return Object.assign(row, {
            userId: row.user_id,
            themeId: row.theme_id,
            loginAt: new Date(row.last_time),
            createdAt: new Date(row.insert_time),
            updatedAt: new Date(row.last_time)
        });
    }), {
        silent: true
    } as any);

    await sequelize.close();
}

main();