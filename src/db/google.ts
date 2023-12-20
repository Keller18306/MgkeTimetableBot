import db from ".";
import { addslashes } from "../utils";

export function getGoogleAccountByEmail(email: string): any {
    return db.prepare('SELECT * FROM google_accounts WHERE `email` = ?').get(email);
}

type AuthFields = Partial<{
    refresh_token: string;
    access_token: string;
    access_token_expires: number;
}>
export function createGoogleAccount(email: string, fields: AuthFields = {}): void {
    const keys = Object.keys(fields).map(value => {
        return `\`${addslashes(value)}\``;
    }).join(', ');

    const valuesVars = Object.keys(fields).map(value => {
        return `:${addslashes(value)}`;
    }).join(', ');

    const valuesUpdate = Object.keys(fields).map(value => {
        return `\`${addslashes(value)}\` = :${addslashes(value)}`;
    }).join(', ');

    const sql = 'INSERT OR REPLACE INTO google_accounts (`email`' + (keys ? ', ' + keys : '') + ') ' +
        'VALUES (:email' + (keys ? ', ' + valuesVars : '') + ') ' +
        'ON CONFLICT(`email`) DO ' + (valuesUpdate ? 'UPDATE SET ' + valuesUpdate : 'IGNORE');

    // console.log(email, fields, sql)

    db.prepare(sql).run(Object.assign({ email }, fields))
}