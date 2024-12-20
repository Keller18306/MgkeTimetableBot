import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';
import throttledQueue from 'throttled-queue';
import { config } from '../../../../config';

export type OnDeleteGoogleEvent = (event: calendar_v3.Schema$Event) => void;

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
    private queue: <Return = unknown>(fn: () => Return | Promise<Return>) => Promise<Return>;
    private queueDeleteEvent: <Return = unknown>(fn: () => Return | Promise<Return>) => Promise<Return>;
    private queueCreateCalendar: <Return = unknown>(fn: () => Return | Promise<Return>) => Promise<Return>;

    constructor(auth: OAuth2Client | GoogleAuth) {
        const { maxRequestsPerInterval, interval } = config.google.rateLimitter;

        this.auth = auth;

        this.queue = throttledQueue(Math.ceil(maxRequestsPerInterval * 0.9), interval, true); //не более запросов
        this.queueDeleteEvent = throttledQueue(80, 60 * 1000, true); // За 1 мин не более 80 удалений событий, иначе гугл ругается хз почему
        this.queueCreateCalendar = throttledQueue(20, 2 * 60 * 60 * 1e3); //не более 20 календарей в 2 часа
    }

    public async createCalendar(title: string) {
        const api = this.api;
        const queue = this.queue;

        const id = await this.queueCreateCalendar(() => {
            return queue(() => {
                return api.calendars.insert({
                    requestBody: {
                        summary: title
                    }
                });
            });
        }).then(({ data }) => {
            return data.id;
        });

        if (!id) {
            throw new Error('couldn\'t create calendar');
        }

        const promises: Promise<any>[] = [];

        promises.push(queue(() => {
            return api.acl.insert({
                calendarId: id,
                sendNotifications: false,
                requestBody: {
                    role: 'reader',
                    scope: {
                        type: 'default'
                    }
                }
            })
        }));

        for (const email of config.google.calendar_owners) {
            promises.push(queue(() => {
                return api.acl.insert({
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
            }))
        }

        await Promise.all(promises);

        return id;
    }

    public async clearDayEvents(calendarId: string, day: Date, onDelete?: OnDeleteGoogleEvent) {
        const api = this.api;
        const queue = this.queue;

        const timeMin = new Date(day);
        timeMin.setHours(0, 0, 0, 0);

        const timeMax = new Date(day);
        timeMax.setHours(23, 59, 59, 0);

        const events = await queue(() => {
            return api.events.list({
                calendarId: calendarId,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString()
            });
        }).then(({ data }) => {
            return data.items;
        });

        if (!events) return;

        const promises: Promise<any>[] = []

        for (const event of events) {
            if (!event.id) {
                continue;
            }

            promises.push(this.queueDeleteEvent(() => {
                return queue(() => {
                    if (onDelete) {
                        onDelete(event);
                    }

                    return api.events.delete({
                        calendarId: calendarId,
                        eventId: event.id!
                    });
                });
            }));
        }

        await Promise.all(promises);
    }

    public async addById(calendarId: string) {
        await this.queue(() => {
            return this.api.calendarList.insert({
                requestBody: {
                    id: calendarId,
                    hidden: false,
                    selected: true
                }
            })
        })
    }

    public async getList(): Promise<string[]> {
        return this.queue(async () => {
            const list = await this.api.calendarList.list();
            return list.data.items?.map((calendar) => {
                return calendar.id!;
            }) ?? [];
        })
    }

    public async deleteFromListById(calendarId: string) {
        await this.queue(() => {
            return this.api.calendarList.delete({ calendarId });
        })
    }

    public async createEvent({ id, calendarId, title, description, location, start, end }: EventData) {
        const response = await this.queue(() => {
            return this.api.events.insert({
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
        });

        return response.data;
    }

    public get api() {
        return google.calendar({
            version: 'v3',
            auth: this.auth
        });
    }
}