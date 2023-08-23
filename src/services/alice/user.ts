import { createAliceUserById, getAliceUserById, updateKeyInTableById } from "../../db";

interface IAliceUserFields {
    id: string;
    userId: string;

    mode: 'teacher' | 'group' | null;
    group: string | null;
    teacher: string | null;
}

class AliceUser {
    public static getById(userId: string): AliceUser {
        const data = getAliceUserById(userId);

        if (!data) {
            createAliceUserById(userId);

            return this.getById(userId);
        }

        return new this(data)
    }

    private constructor(private data: any) {
        return new Proxy(this, {
            get: (target: this, p: string, receiver: any) => {
                if (Object.keys(this.data).includes(p)) {
                    return this.data[p];
                }

                return Reflect.get(target, p, receiver);
            },
            set: (target: this, key: string, value: any, receiver: any) => {
                if (Object.keys(this.data).includes(key)) {
                    if (typeof value === 'boolean') {
                        value = Number(value)
                    }

                    updateKeyInTableById('alice_users', key, value, this.data.id);
                    this.data[key] = value;

                    return true;
                }

                return Reflect.set(target, key, value, receiver);
            }
        })
    }
}

interface AliceUser extends IAliceUserFields { };

export { AliceUser };