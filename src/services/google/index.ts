import { Application, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import StatusCode from 'status-code-enum';
import { config } from '../../../config';
import { GoogleUserApi } from './api';
import { GoogleUser } from './user';

export class GoogleService {
    constructor(app: Application) {
        app.get(config.google.url, expressAsyncHandler(this.oauth.bind(this)));
        
        if (config.dev) {
            app.get('/google/link', this.link.bind(this));
        }
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