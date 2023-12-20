import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { config } from '../../../../config';
import { GoogleCalendarApi } from './calendar';

//TODO singleton
export class GoogleServiceApi {
    private auth: GoogleAuth;

    public static createAuth(): GoogleAuth {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: config.google.service_account.clientEmail,
                private_key: config.google.service_account.privateKey
            },
            scopes: [
                'https://www.googleapis.com/auth/calendar'
            ]
        });
    }

    constructor() {
        this.auth = GoogleServiceApi.createAuth();
    }

    public getAuth() {
        return this.auth;
    }

    public get calendar() {
        return new GoogleCalendarApi(this.auth);
    }
}
