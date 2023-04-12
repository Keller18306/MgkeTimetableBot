import { Application, Request, Response } from 'express';
import { readdirSync } from 'fs';
import path from 'path';
import { StatusCode } from 'status-code-enum';
import { config } from '../../../config';
import VKAppDefaultMethod, { HandlerParams } from './methods/_default';
import { VKAppUser } from './user';

export class VKApp {
    private loaded: {
        [method: string]: {
            [method: string]: VKAppDefaultMethod
        }
    } = {};

    constructor(app: Application) {
        this.loadMethods()
        app.use(`${config.vk.app.url}/:method`,
            (request, response) => this.handler(request, response)
        )
    }

    loadMethods() {
        const methodsPath = path.join(__dirname, 'methods')

        const files = readdirSync(methodsPath)

        for (const file of files) {
            const { default: _class } = require(path.join(methodsPath, file))
            if (_class === undefined) continue;

            const method: VKAppDefaultMethod = new _class()
            if (method.method === undefined) continue;

            if (this.loaded[method.httpMethod]?.[method.method] !== undefined)
                throw new Error(`${method.httpMethod} /${method.method} is already loaded!`)

            if (this.loaded[method.httpMethod] === undefined) this.loaded[method.httpMethod] = {}
            this.loaded[method.httpMethod][method.method] = method
        }

        console.log(`[VK App] Loaded ${this.getCountMethods()} methods`)
    }

    public getCountMethods(): number {
        let count = 0
        for (const httpMethod in this.loaded) {
            count += Object.keys(this.loaded[httpMethod]).length
        }
        return count
    }

    private async handler(request: Request<{ method: string; }>, response: Response) {
        if (request.method.toUpperCase() === 'POST' && request.headers['content-type']?.split(';')[0] !== 'application/json')
            return this.badRequest(request, response)

        const method = request.params.method;

        const _class = this.loaded[request.method.toUpperCase()]?.[method];

        if (_class === undefined) return response.status(StatusCode.ClientErrorNotFound).send();

        const user = new VKAppUser(request.protocol + '://' + request.hostname + request.url);
        if (!user.checkSign()) return this.notAuthorized({ user, request, response });
        if (!user.accepted) return this.notAccepted({ user, request, response });

        (async () => {
            try {
                let message = _class.handler({ user, request, response })

                if (message === undefined) return;

                response.send({
                    auth: true,
                    access: true,
                    response: message
                })
            } catch (e) {
                response.status(StatusCode.ServerErrorInternal).send('server error')
                console.error(e)
            }
        })();
    }

    private notAuthorized({ response }: HandlerParams) {
        return response.send({
            auth: false,
            access: false
        })
    }

    private notAccepted({ user, response }: HandlerParams) {
        return response.send({
            auth: true,
            access: false,
            key: user.acceptKey
        })
    }

    private badRequest(request: Request<{ method: string; }>, response: Response) {
        return response.status(StatusCode.ClientErrorBadRequest).send('Bad Request');
    }
}
