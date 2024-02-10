import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { config } from '../../../../config';
import { serialize } from '../../../utils';
import { GoogleCalendarApi } from './calendar';

export class GoogleUserApi {
    private auth: OAuth2Client;

    public static createAuth(): OAuth2Client {
        return new google.auth.OAuth2(
            config.google.oauth.clientId, config.google.oauth.clientSecret,
            'https://' + config.google.redirectDomain + config.google.url
        );
    }

    public static _requiredScopes() {
        return [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email'
        ];
    }

    public static getAuthUrl(state?: any): string {
        if (state) {
            state = serialize(state);
        }

        return this.createAuth().generateAuthUrl({
            access_type: 'offline',
            scope: this._requiredScopes(),
            state: state
        });
    }

    public static async createClientFromCode(code: string): Promise<GoogleUserApi> {
        const result = await this.createAuth().getToken(code);

        return new this(result.tokens);
    }

    constructor(credentials: Credentials, onTokens?: (tokens: Credentials) => void) {
        this.auth = GoogleUserApi.createAuth();
        this.auth.setCredentials(credentials);

        if (onTokens) {
            this.auth.on('tokens', onTokens);
        }
    }

    public async getUserInfo() {
        const { token } = await this.auth.getAccessToken();
        if (!token) {
            throw new Error('cannot get user token');
        }

        const result = await this.auth.getTokenInfo(token);

        return result;
    }

    public getAuth() {
        return this.auth;
    }

    public get calendar() {
        return new GoogleCalendarApi(this.auth);
    }

    public async revokeCredentials() {
        return this.auth.revokeCredentials();
    }

    public exportCredentials(): Credentials {
        return this.auth.credentials;
    }
}
