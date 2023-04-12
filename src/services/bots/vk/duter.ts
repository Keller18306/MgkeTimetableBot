import { CronJob } from 'cron';
import { getRandomId, Keyboard, KeyboardBuilder } from "vk-io";
import { VkBot } from '.';
import db from "../../../db";
import { VkChat, VkDb } from './chat';

const vk = VkBot.instance.vk

export function getTodayDuty(chat: VkDb, skipped: boolean = false) {
    if (chat.duty_student == null) throw new Error('duter is disabled')

    const user = db.prepare('SELECT * FROM `students` WHERE `peerId` = ? LIMIT 1 OFFSET ?').get(chat.peerId, chat.duty_student)

    const message = `Сегодня дежурит: ${user.vk_id !== null ? `[id${user.vk_id}|${user.name}]` : user.name} (${user.skip_count})`
    const keyboard = new KeyboardBuilder().inline(true)
        .callbackButton({
            label: user.skip_count > 0 ? 'Опять не пришёл' : 'Не пришёл',
            color: Keyboard.NEGATIVE_COLOR,
            payload: {
                ui: user.id,
                action: 'skip',
                type: 'today',
                increment: true,
                again: skipped
            }
        }).callbackButton({
            label: 'Пропустить',
            color: Keyboard.POSITIVE_COLOR,
            payload: {
                ui: user.id,
                action: 'skip',
                type: 'today',
                increment: false,
                again: false
            }
        })

    return {
        message, keyboard
    }
}

export function getTomorrowDuty(chat: VkDb) {
    if (chat.duty_student == null) throw new Error('duter is disabled')
    const users_count = db.prepare('SELECT COUNT(*) as `count` FROM `students` WHERE `peerId` = ?').get(chat.peerId).count

    let user: any | null = null;
    let duty_student = chat.duty_student
    while (user === null) {
        if (duty_student >= users_count) duty_student -= users_count

        const _user = db.prepare('SELECT * FROM `students` WHERE `peerId` = ? LIMIT 1 OFFSET ?').get(chat.peerId, duty_student)
        if (_user.skip || _user.ignore || _user.skip_count == 0) {
            duty_student++
            continue;
        }

        user = _user
    }

    const message = `Завтра дежурит: ${user.vk_id !== null ? `[id${user.vk_id}|${user.name}]` : user.name} (${user.skip_count})`
    const keyboard = new KeyboardBuilder().inline(true)
        .callbackButton({
            label: user.skip_count > 0 ? 'Опять не придёт' : 'Не придёт',
            color: Keyboard.NEGATIVE_COLOR,
            payload: {
                ui: user.id,
                action: 'skip',
                type: 'tomorrow',
                increment: true,
                again: false
            }
        }).callbackButton({
            label: 'Пропустить',
            color: Keyboard.POSITIVE_COLOR,
            payload: {
                ui: user.id,
                action: 'skip',
                type: 'tomorrow',
                increment: false,
                again: false
            }
        })

    return {
        message, keyboard
    }
}

export async function sendTodayDuty(chat: VkDb, disable_mention: boolean = true, skipped: boolean = false) {
    const { message, keyboard } = getTodayDuty(chat, skipped)

    return vk.api.messages.send({
        peer_id: chat.peerId,
        random_id: getRandomId(),
        message: message,
        keyboard: keyboard,
        disable_mentions: disable_mention
    })
}

export async function sendTomorrowDuty(chat: VkDb, disable_mention: boolean = true) {
    const { message, keyboard } = getTomorrowDuty(chat)

    return vk.api.messages.send({
        peer_id: chat.peerId,
        random_id: getRandomId(),
        message: message,
        keyboard: keyboard,
        disable_mentions: disable_mention
    })
}

export function doDuty(chat: VkDb, skip: boolean = false): boolean {
    if (chat.duty_student == null) throw new Error('duter is disabled')
    const users_count = db.prepare('SELECT COUNT(*) as `count` FROM `students` WHERE `peerId` = ?').get(chat.peerId).count

    let user = db.prepare('SELECT * FROM `students` WHERE `peerId` = ? LIMIT 1 OFFSET ?').get(chat.peerId, chat.duty_student)

    if (!skip && user.skip_count > 0) {
        db.prepare('UPDATE `students` SET `skip_count` = `skip_count` - 1 WHERE `id` = ?').run(user.id)
        return true;
    }

    let duty_id = chat.duty_student + 1
    if (duty_id >= users_count) duty_id -= users_count

    db.prepare('UPDATE `vk_bot_chats` SET `duty_student` = ? WHERE `peerId` = ?').run(duty_id, chat.peerId)
    chat.duty_student = duty_id

    user = db.prepare('SELECT * FROM `students` WHERE `peerId` = ? LIMIT 1 OFFSET ?').get(chat.peerId, duty_id)

    if (user.skip || user.ignore) return doDuty(chat, true)

    return false;
}

export async function todayHandler() {
    if (new Date().getDay() == 0) return;

    const chats = db.prepare('SELECT * FROM `vk_bot_chats` WHERE `duty_student` IS NOT NULL').all() as VkDb[]
    for (const chat of chats) {
        const skipped = doDuty(chat)
        await sendTodayDuty(chat, false, skipped)
        db.prepare('UPDATE `students` SET `skip` = 0 WHERE `peerId` = ?').run(chat.peerId)
    }
}

export async function tomorrowHandler() {
    if (new Date().getDay() == 6) return;

    const chats = db.prepare('SELECT * FROM `vk_bot_chats` WHERE `duty_student` IS NOT NULL').all() as VkDb[]
    for (const chat of chats) await sendTomorrowDuty(chat, false)
}

/*
Seconds: 0-59
Minutes: 0-59
Hours: 0-23
Day of Month: 1-31
Months: 0-11 (Jan-Dec)
Day of Week: 0-6 (Sun-Sat)
*/

//today
new CronJob('0 0 7 * * *', todayHandler, null, true).start()

//tomorrow
new CronJob('0 0 18 * * *', tomorrowHandler, null, true).start()