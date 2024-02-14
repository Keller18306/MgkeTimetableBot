import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import StatusCode from 'status-code-enum';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { config } from '../../../config';
import { App, AppService } from '../../app';
import { unserialize } from '../../utils';
import { AbstractBot, AbstractChat, BotServiceName } from '../bots/abstract';
import { GoogleUserApi } from './api';
import { GoogleCalendar } from './calendar';
import { GoogleUser } from './user';

type AuthState = {
    service: 'test'
} | {
    service: BotServiceName,
    peerId: string | number
}

export class GoogleService implements AppService {
    private app: App;
    public calendar: GoogleCalendar;

    constructor(app: App) {
        this.app = app;
        this.calendar = new GoogleCalendar(app);
    }

    public run() {
        const server = this.app.getService('http').getServer();

        server.get(config.google.url, expressAsyncHandler(this.oauth.bind(this)));

        if (config.dev) {
            server.get('/google/link', this.link.bind(this));
        }

        this.calendar.run();
    }

    public getAuthUrl(state: AuthState): string {
        return GoogleUserApi.getAuthUrl(state);
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

        GoogleUser.create(info.email, api.exportCredentials());

        if (state.service === 'test') {
            response.send({ info, auth: api.exportCredentials(), state });
            return;
        }

        const service: AbstractBot = this.app.getService(state.service);
        if (service instanceof AbstractBot) {
            const chat: AbstractChat = service.getChat(state.peerId).resync(true);

            chat.google_email = info.email;
            service.event.sendMessage(chat, `Гугл аккаунт '${chat.google_email}' успешно привязан!`);
            
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