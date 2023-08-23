import db from ".";
import { addslashes } from "../utils";

export function updateKeyInTableById(table: string, key: string, value: any, id: any): void {
    db.prepare(`UPDATE ${table} SET \`${addslashes(key)}\` = ? WHERE id = ?`).run(value, id);
}

export function getRowsCountInTable(table: string): number {
    return (db.prepare('SELECT COUNT(*) as `count` FROM `' + table + '`').get() as any).count;
}

export function vaccum(): void {
    db.prepare('VACUUM').run();
}