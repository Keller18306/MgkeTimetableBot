import db from "../../../db";

export class FileCache {
    constructor(
        private storageName: string
    ) {}

    public get(key: string): string | null {
        const entry: any = db.prepare("SELECT * FROM storage WHERE `storage` = ? AND `key` = ?").get(this.storageName, key);

        return entry?.value || null;
    }

    public add(key: string, value: string) {
        const time = Math.floor(Date.now() / 1e3);
        db.prepare('INSERT INTO storage (`storage`, `key`, `value`, `time`) VALUES (?, ?, ?, ?)').run(this.storageName, key, value, time);
    }
}