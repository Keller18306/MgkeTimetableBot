import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import StatusCode from 'status-code-enum';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { config } from '../../../config';
import { App, AppService } from '../../app';
import { unserialize } from '../../utils';
import { GoogleUserApi } from './api';
import { GoogleCalendar } from './calendar';
import { GoogleUser } from './user';

export class GoogleService implements AppService {
    private app: App;
    public calendar: GoogleCalendar;

    constructor(app: App) {
        this.app = app;
        this.calendar = new GoogleCalendar(app);
    }

    public register(): boolean {
        return config.google.enabled;
    }

    public run() {
        const server = this.app.getService('http').getServer();

        server.get(config.google.url, expressAsyncHandler(this.oauth.bind(this)));

        if (config.dev) {
            server.get('/google/link', this.link.bind(this));
        }

        this.calendar.run();
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
                    return unserialize(data)
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

        response.send('TODO PROVIDE TO SERVICES');
    }

    private link(request: Request, response: Response) {
        const url = GoogleUserApi.getAuthUrl({
            service: 'test'
        });
        return response.redirect(url);
    }
}