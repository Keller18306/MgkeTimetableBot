import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import StatusCode from 'status-code-enum';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { config } from '../../../config';
import { App, AppService } from '../../app';
import { unserialize } from '../../utils';
import { AbstractBot, BotServiceName } from '../bots/abstract';
import { GoogleKeyboard } from '../bots/callbacks/google';
import { BotChat } from '../bots/chat';
import { GoogleServiceApi, GoogleUserApi } from './api';
import { GoogleCalendarController } from './controller';
import { CalendarItem } from './models/calendar';
import { GoogleUser } from './models/user';

type AuthState = {
    service: 'test'
} | {
    service: BotServiceName,
    peerId: string | number
}

export class GoogleService implements AppService {
    public readonly api: GoogleServiceApi;
    public calendarController: GoogleCalendarController;

    private app: App;

    constructor(app: App) {
        this.app = app;
        this.api = new GoogleServiceApi();
        this.calendarController = new GoogleCalendarController(app);

        CalendarItem.api = this.api.calendar;
    }

    public run() {
        const server = this.app.getService('http').getServer();

        server.get(config.google.url, expressAsyncHandler(this.oauth.bind(this)));

        if (config.dev) {
            server.get('/google/link', this.link.bind(this));
        }

        this.calendarController.run();
    }

    public getAuthUrl(state: AuthState): string {
        return GoogleUserApi.getAuthUrl(state);
    }

    public getByEmail(email: string): Promise<GoogleUser> {
        return GoogleUser.getByEmail(email);
    }

    private async oauth(request: Request<null, null, null, Partial<{ code: string }>>, response: Response): Promise<void> {
        const result = z.object({
            code: z.string({
                required_error: 'Auth code not provided'
            }).min(1, {
                message: 'Auth code not provided'
            }),
            state: z.string({
                required_error: 'State not provided'
            }).transform((data: string, ctx) => {
                try {
                    return unserialize(data) as AuthState
                } catch (e: any) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: e.toString()
                    })

                    return z.NEVER;
                }
            })
        }).safeParse(request.query);

        if (!result.success) {
            response.status(StatusCode.ClientErrorBadRequest).send(fromZodError(result.error).toString());
            return;
        }

        const { code, state } = result.data;

        let api: GoogleUserApi;
        try {
            api = await GoogleUserApi.createClientFromCode(code);
        } catch (e: any) {
            response.status(e.status).send(e.response.data);

            return;
        }

        const info = await api.getUserInfo();

        const hasAllScopes: boolean = GoogleUserApi._requiredScopes().every((scope) => {
            return info.scopes.includes(scope);
        });
        if (!hasAllScopes) {
            response.send('Not all scopes given');
            return;
        }

        if (!info.email) {
            response.send('Email not provided');
            return;
        }

        await GoogleUser.createByEmail(info.email, api.exportCredentials());

        if (state.service === 'test') {
            response.send({ info, auth: api.exportCredentials(), state });
            return;
        }

        const service: AbstractBot = this.app.getService(state.service);
        if (service instanceof AbstractBot) {
            const chat: BotChat = await service.getChat(state.peerId);

            await chat.update({ googleEmail: info.email });
            await service.event.sendMessage(chat, `Гугл аккаунт '${chat.googleEmail}' успешно привязан!`, {
                keyboard: GoogleKeyboard.ControlCalendar
            });

            response.send('Аккаунт успешно привязан, можете вернуться обратно в чат');

            return;
        }

        response.send('Unsupported service');
    }

    private link(request: Request, response: Response) {
        const url = GoogleUserApi.getAuthUrl({
            service: 'test'
        });
        return response.redirect(url);
    }
}