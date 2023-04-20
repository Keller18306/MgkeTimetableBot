import db from "../../db";
import { addslashes } from "../../utils";

interface IAliceUserFields {
    id: string;
    userId: string;

    mode: 'teacher' | 'group' | null;
    group: string | null;
    teacher: string | null;
}

class AliceUser {
    private static _tableName: string = 'alice_users';

    public static getById(userId: string): AliceUser {
        const data = db.prepare('SELECT * FROM ' + this._tableName + ' WHERE `userId` = ?').get(userId);

        if (!data) {
            this.createUser(userId);

            return this.getById(userId);
        }

        return new this(data)
    }

    private static createUser(userId: string) {
        db.prepare('INSERT INTO ' + this._tableName + ' (`userId`) VALUES (?)').run(userId)
    }

    private constructor(private data: any) {
        return new Proxy(this, {
            get: (target: this, p: string, receiver: any) => {
                if (Object.keys(this.data).includes(p)) {
                    return this.data[p];
                }

                return Reflect.get(target, p, receiver);
            },
            set: (target: this, p: string, value: any, receiver: any) => {
                if (Object.keys(this.data).includes(p)) {
                    if (typeof value === 'boolean') {
                        value = Number(value)
                    }

                    db.prepare('UPDATE ' + AliceUser._tableName + ' SET `' + addslashes(p) + '` = ? WHERE `id` = ?').run(value, this.data.id)
                    this.data[p] = value;

                    return true;
                }

                return Reflect.set(target, p, value, receiver);
            }
        })
    }
}

interface AliceUser extends IAliceUserFields { };

export { AliceUser };
