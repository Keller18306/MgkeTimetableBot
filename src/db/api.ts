import db from ".";

export function getApiKeyById(id: bigint | number): any {
    return db.prepare('SELECT * FROM `api` WHERE `id` = ?').get(id);
}

export function updateLastApiKeyUse(id: bigint | number, time: number): void {
    db.prepare('UPDATE `api` SET `last_time` = ? WHERE `id` = ?').run(time, id);
}