import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import StatusCode from 'status-code-enum';
import { config } from '../../../config';
import { App, AppService } from '../../app';
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
        const code = request.query.code;
        if (!code) {
            response.status(StatusCode.ClientErrorBadRequest).send('Auth code not provided');

            return;
        }

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

        response.send({ info, auth: api.exportCredentials() });
    }

    private link(request: Request, response: Response) {
        const url = GoogleUserApi.getAuthUrl();
        return response.redirect(url);
    }
}