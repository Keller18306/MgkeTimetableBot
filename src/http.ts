import express, { Application, NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { getIp, getParams, replaceWithValueLength } from './utils';

type ErrorWithStatus = Error & Partial<{ status: number; statusCode: number, code: any, type: any }>;

export class HttpServer {
    public app: Application;

    private handlers: any[] = [];

    constructor() {
        this.app = express();

        this.app.use(this.errorHandler.bind(this));
        this.app.use(express.static('./public/'));

        if (config.dev) {
            this.logRoutes();
        }

        this.setupOriginHeaders();
    }

    public run() {
        this.app.listen(config.http.port, () => {
            console.log(`[HTTP] Server started on port ${config.http.port}`);
        });
    }

    public register<T extends new (app: Application) => any>(classHandler: T): InstanceType<T> {
        const handler = new classHandler(this.app);
        this.handlers.push(handler);
        return handler;
    }

    private setupOriginHeaders() {
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Max-Age', '86400')
            next();
        });

        this.app.use((req, res, next) => {
            if (req.method.toUpperCase() !== 'OPTIONS') return next();

            res.send()
        });
    }

    private logRoutes() {
        this.app.use((req, res, next) => {
            console.log(getIp(req), req.path, replaceWithValueLength(getParams(req)));
            next();
        })
    }

    private errorHandler(err: ErrorWithStatus | null, req: Request, response: Response, next: NextFunction) {
        if (err === null) return next();

        let status: number = err.status ?? err.statusCode ?? 500;

        if (status < 400) {
            status = 500;
        }

        response.status(status);

        const body: any = {
            status
        };

        if (process.env.NODE_ENV !== 'production') {
            // body.stack = err.stack;
            body.trace = err.stack?.replace(/\ +/g, ' ')
                .replace(/(\n\ )+/g, '\n')
                .split('\t')
                .join('')
                .split('\n')
                .slice(1) || [];
        }

        Object.assign(body, {
            code: err.code,
            name: err.name,
            message: err.message,
            type: err.type
        });

        if (status >= 500) {
            console.error(err);
        }

        return response.json(body)
    }
}
