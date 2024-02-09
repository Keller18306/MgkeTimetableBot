import db from ".";
import { addslashes } from "../utils";

export function getValueFromStorageByKey(storage: string, key: string): any {
    return db.prepare("SELECT * FROM storage WHERE `storage` = ? AND `key` = ?").get(storage, key);
}

export function addValueIntoStorageByKey(storage: string, key: string, value: string, time: number, expires: number): void {
    db.prepare(
        'INSERT INTO storage (`storage`, `key`, `value`, `time`) VALUES (:storage, :key, :value, :time, :expires) ON CONFLICT(`storage`, `key`) DO UPDATE SET value = :value, time = :time, expires = :expires')
        .run({ storage, key, value, time, expires });
}

export function updateMetaStorageByKey(storage: string, key: string, meta: string): any {
    return db.prepare("UPDATE storage SET meta = ? WHERE `storage` = ? AND `key` = ?").run(meta, storage, key);
}