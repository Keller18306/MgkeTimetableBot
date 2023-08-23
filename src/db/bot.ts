import db from ".";
import { config } from "../../config";
import { ChatMode } from "../services/bots/abstract";
import { addslashes } from "../utils";

export function getBotUser(table: string, service: string, peerId: string | number): any {
    return db.prepare(
        `SELECT * FROM ${table} JOIN chat_options ON ${table}.id = chat_options.id AND chat_options.service = ? WHERE ${table}.peerId = ?`
    ).get(service, peerId);
}

export function addNewBotUser(table: string, service: string, peerId: string | number, accepted: boolean, allowSendMess: boolean) {
    const { lastInsertRowid } = db.prepare(`INSERT INTO ${table} (peerId) VALUES (?)`).run(peerId);

    db.prepare(
        'INSERT INTO chat_options (`service`, `id`, `accepted`, `allowSendMess`) VALUES (?, ?, ?, ?)'
    ).run(service, lastInsertRowid, +accepted, +allowSendMess);
}

export function updateKeyInTableByPeerId(table: string, key: string, value: any, peerId: string | number): void {
    db.prepare(`UPDATE ${table} SET \`${addslashes(key)}\` = ? WHERE peerId = ?`).run(value, peerId);
}

export function updateChatOptionsKeyByPeerId(table: string, service: string, key: string, value: any, peerId: string | number) {
    db.prepare(`UPDATE chat_options SET \`${addslashes(key)}\` = ? WHERE id = (
        SELECT id FROM ${table} WHERE peerId = ?
    ) AND service = ?`).run(value, peerId, service);
}

export function getGroupsChats(table: string, service: string, groups: string | string[]): any {
    return db.prepare(
        "SELECT * FROM chat_options JOIN `" + table + "` ON chat_options.id = " + table + ".id WHERE `service` = ? AND `group` IN (" + Array(groups.length).fill('?') + ") AND (`deactivateSecondaryCheck` = 1 OR `mode` = 'student' OR `mode` = 'parent') AND `accepted` = 1 AND `noticeChanges` = 1 AND `allowSendMess` = 1"
        + (config.dev ? ' AND `noticeParserErrors` = 1' : '')
    ).all(service, ...groups);
}

export function getTeachersChats(table: string, service: string, teachers: string | string[]): any {
    return db.prepare(
        "SELECT * FROM chat_options JOIN `" + table + "` ON chat_options.id = " + table + ".id WHERE `service` = ? AND `teacher` IN (" + Array(teachers.length).fill('?') + ") AND (`deactivateSecondaryCheck` = 1 OR `mode` = 'teacher') AND `accepted` = 1 AND `noticeChanges` = 1 AND `allowSendMess` = 1"
        + (config.dev ? ' AND `noticeParserErrors` = 1' : '')
    ).all(service, ...teachers);
}

export function getNoticeNextWeekChats(table: string, service: string, chatMode: ChatMode): any {
    return db.prepare(
        "SELECT * FROM chat_options JOIN `" + table + "` ON chat_options.id = " + table + ".id WHERE `service` = ? AND `accepted` = 1 AND `allowSendMess` = 1 AND `noticeNextWeek` = 1 AND `mode` = ?"
        + (config.dev ? ' AND `noticeParserErrors` = 1' : '')
    ).all(service, chatMode)
}

export function getDistributionChats(table: string, service: string): any {
    return db.prepare(
        "SELECT * FROM chat_options JOIN `" + table + "` ON chat_options.id = " + table + ".id WHERE `service` = ? AND `accepted` = 1 AND `allowSendMess` = 1 AND `subscribeDistribution` = 1"
        + (config.dev ? ' AND `noticeParserErrors` = 1' : '')
    ).all(service)
}

export function getNoticeErrorsChats(table: string, service: string): any {
    return db.prepare(
        "SELECT * FROM chat_options JOIN `" + table + "` ON chat_options.id = " + table + ".id WHERE `service` = ? AND `accepted` = 1 AND `allowSendMess` = 1 AND `noticeParserErrors` = 1"
    ).all(service)
}

export function getAllowSendMessCount(service: string): number {
    return (db.prepare("SELECT COUNT(*) as `count` FROM `chat_options` WHERE `service` = ? AND `allowSendMess` = 1").get(service) as any).count;
}