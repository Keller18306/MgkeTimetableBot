import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { config } from '../../../../config';

type EventData = {
    id?: string,
    calendarId: string,
    title: string,
    description?: string,
    location?: string,
    start: Date,
    end: Date
}
export class GoogleCalendarApi {
    private auth: OAuth2Client | GoogleAuth;

    constructor(auth: OAuth2Client | GoogleAuth) {
        this.auth = auth;
    }

    public async create(title: string) {
        const api = this.api;

        const id = await api.calendars.insert({
            requestBody: {
                summary: title
            }
        }).then(({ data }) => {
            return data.id;
        });

        if (!id) {
            throw new Error('couldn\'t create calendar');
        }

        await api.acl.insert({
            calendarId: id,
            sendNotifications: false,
            requestBody: {
                role: 'reader',
                scope: {
                    type: 'default'
                }
            }
        })

        for (const email of config.google.calendar_owners) {
            await api.acl.insert({
                calendarId: id,
                sendNotifications: false,
                requestBody: {
                    role: 'owner',
                    scope: {
                        type: 'user',
                        value: email
                    }
                }
            })
        }

        return id;
    }

    public async clear(id: string) {
        await this.api.calendars.clear({
            calendarId: id
        });
    }

    public async addById(id: string) {
        await this.api.calendarList.insert({
            requestBody: { id }
        })
    }

    public async createEvent({ id, calendarId, title, description, location, start, end }: EventData) {
        const response = await this.api.events.insert({
            calendarId: calendarId,
            requestBody: {
                id: id,
                summary: title,
                description: description,
                location: location,
                start: {
                    dateTime: start.toISOString()
                },
                end: {
                    dateTime: end.toISOString()
                }
            }
        });

        return response.data.id;
    }

    public get api() {
        return google.calendar({
            version: 'v3',
            auth: this.auth
        });
    }
}