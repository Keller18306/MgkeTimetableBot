import { Credentials } from 'google-auth-library';
import { updateKeyInTableById } from "../../db";
import { GoogleUserApi } from "./api";
import { createGoogleAccount, getGoogleAccountByEmail } from '../../db/google';

interface IAliceUserFields {
    id: string;
    email: string;
    refresh_token: string | null;
    access_token: string | null;
    access_token_expires: number | null;
}

class GoogleUser {
    public static getByEmail(email: string): GoogleUser {
        const data = getGoogleAccountByEmail(email);
        if (!data) {
            throw new Error('Google account not exists')
        }

        return new this(data)
    }

    public static create(email: string, credentials: Credentials) {
        createGoogleAccount(email, {
            refresh_token: credentials.refresh_token ?? undefined,
            access_token: credentials.access_token ?? undefined,
            access_token_expires: credentials.expiry_date ?? undefined
        });

        // return this.getByEmail(email);
    }

    private _api?: GoogleUserApi;

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

    public get api(): GoogleUserApi {
        if (!this._api) {
            this._api = new GoogleUserApi({
                refresh_token: this.refresh_token,
                access_token: this.access_token,
                expiry_date: this.access_token_expires
            }, this.updateCredentials.bind(this));
        }

        return this._api;
    }

    private updateCredentials(credentials: Credentials) {

    }
}

interface GoogleUser extends IAliceUserFields { };

export { GoogleUser };
