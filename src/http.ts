import express, { Application } from 'express';
import { config } from '../config';

export class HttpServer {
    public app: Application;

    private handlers: any[] = [];

    constructor() {
        this.app = express();
        this.app.use(express.static('./public/'));

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
}
