import express, { Application, NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { AppService } from './app';
import { getIp, getParams, replaceWithValueLength } from './utils';

type ErrorWithStatus = Error & Partial<{ status: number; statusCode: number, code: any, type: any }>;

export class HttpService implements AppService {
    private http: Application;

    public ignoreJsonParserUrls: string[] = [];

    constructor() {
        this.http = express();
    }

    public getServer() {
        return this.http;
    }

    public register(): boolean {
        return config.http.enabled;
    }

    public run() {
        this.http.use(express.static('./public/'));
        
        if (config.dev) {
            this.logRoutes();
        }
        
        this.setupOriginHeaders();
        this.setupJsonBodyParser();
        
        this.http.use(this.errorHandler.bind(this));
        
        this.http.listen(config.http.port, () => {
            console.log(`[HTTP] Server started on port ${config.http.port}`);
        });
    }

    private setupOriginHeaders() {
        this.http.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Max-Age', '86400')
            next();
        });

        this.http.use((req, res, next) => {
            if (req.method.toUpperCase() !== 'OPTIONS') return next();

            res.send()
        });
    }

    private setupJsonBodyParser() {
        this.http.use((req, res, next) => {
            for (const url of this.ignoreJsonParserUrls) {
                if (req.path.startsWith(url)) {
                    return next();
                }
            }

            return express.json({})(req, res, next)
        })
    }

    private logRoutes() {
        this.http.use((req, res, next) => {
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
