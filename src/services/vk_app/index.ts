import { Request, Response } from 'express';
import { readdirSync } from 'fs';
import path from 'path';
import { StatusCode } from 'status-code-enum';
import { config } from '../../../config';
import { App, AppService } from '../../app';
import { FromType, RequestKey } from '../../key';
import { Logger } from '../../logger';
import { checkSign } from './checkSign';
import VKAppDefaultMethod from './methods/_default';
import { VKAppUser } from './user';

const VALID_URL_TIME: number = 86400;
const acceptTool = new RequestKey(config.encrypt_key);

type ErrorParams = {
    userId: number | null,
    request: Request,
    response: Response
}

function parseUrl(url: string) {
    const data = new URL(url)

    const query: {
        [key: string]: string
    } = {}

    data.searchParams.forEach((value, key) => {
        query[key] = value
    })

    return query
}

export class VKApp implements AppService {
    public logger: Logger = new Logger('VK App');

    private loaded: {
        [method: string]: {
            [method: string]: VKAppDefaultMethod
        }
    } = {};

    constructor(private app: App) { }

    public run() {
        const server = this.app.getService('http').getServer();

        this.loadMethods();

        server.use(`${config.vk.app.url}/:method`,
            (request, response) => this.handler(request, response)
        )
    }

    private loadMethods() {
        const methodsPath = path.join(__dirname, 'methods')

        const files = readdirSync(methodsPath)

        for (const file of files) {
            const { default: _class } = require(path.join(methodsPath, file))
            if (_class === undefined) {
                continue;
            }

            const method: VKAppDefaultMethod = new _class()
            if (method.method === undefined) {
                continue;
            }

            if (this.loaded[method.httpMethod]?.[method.method] !== undefined) {
                throw new Error(`${method.httpMethod} /${method.method} is already loaded!`)
            }

            if (this.loaded[method.httpMethod] === undefined) {
                this.loaded[method.httpMethod] = {}
            }

            this.loaded[method.httpMethod][method.method] = method;
        }

        this.logger.log(`Загружено методов: ${this.getCountMethods()}`)
    }

    public getCountMethods(): number {
        let count = 0

        for (const httpMethod in this.loaded) {
            count += Object.keys(this.loaded[httpMethod]).length;
        }

        return count;
    }

    private async handler(request: Request<{ method: string; }>, response: Response) {
        if (request.method.toUpperCase() === 'POST' && request.headers['content-type']?.split(';')[0] !== 'application/json') {
            return this.badRequest(request, response);
        }

        const method = request.params.method;
        const _class = this.loaded[request.method.toUpperCase()]?.[method];
        if (_class === undefined) {
            return response.status(StatusCode.ClientErrorNotFound).send();
        }

        const userId = this.getUserIdFromUrl(request.protocol + '://' + request.hostname + request.url);
        if (!userId) {
            return this.notAuthorized({ userId, request, response });
        }

        const user = await VKAppUser.getOrCreateByUserId(userId);
        if (!user) {
            return this.notAuthorized({ userId, request, response });
        }

        if (!user.accepted) {
            return this.notAccepted({ userId, request, response });
        }

        (async () => {
            try {
                await user.update({
                    loginAt: new Date()
                }, {
                    silent: true
                });

                const message = _class.handler({ user, request, response });
                if (message === undefined) {
                    return;
                }

                response.send({
                    auth: true,
                    access: true,
                    response: message
                });
            } catch (e) {
                response.status(StatusCode.ServerErrorInternal).send('server error')
                this.logger.error(e);
            }
        })();
    }

    private notAuthorized({ response }: ErrorParams) {
        return response.send({
            auth: false,
            access: false
        });
    }

    private notAccepted({ userId, response }: ErrorParams) {
        if (!userId) {
            throw new Error('userId not provided');
        }

        return response.send({
            auth: true,
            access: false,
            key: this.getAcceptKey(userId)
        });
    }

    private badRequest(request: Request<{ method: string; }>, response: Response) {
        return response.status(StatusCode.ClientErrorBadRequest).send('Bad Request');
    }

    private getUserIdFromUrl(url: string) {
        if (!checkSign(url, config.vk.app, VALID_URL_TIME)) {
            return null;
        }

        return Number(parseUrl(url).vk_user_id);
    }


    private getAcceptKey(userId: number): string {
        return acceptTool.getKey({
            from: FromType.VKApp,
            user_id: userId,
            time: Date.now()
        });
    }
}
