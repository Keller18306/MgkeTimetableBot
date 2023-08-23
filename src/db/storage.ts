import db from ".";

export function getValueFromStorageByKey(storage: string, key: string): any {
    return db.prepare("SELECT * FROM storage WHERE `storage` = ? AND `key` = ?").get(storage, key);
}

export function addValueIntoStorageByKey(storage: string, key: string, value: string, time: number): void {
    db.prepare('INSERT INTO storage (`storage`, `key`, `value`, `time`) VALUES (?, ?, ?, ?)').run(storage, key, value, time);
}