import { config } from '../config';
import express from 'express';

export class HttpServer {
    private static _instance: HttpServer;

    public app: express.Application;

    public static get instance(): HttpServer {
        if (!HttpServer._instance) {
            HttpServer._instance = new HttpServer();
        }

        return HttpServer._instance;
    }

    constructor() {
        if (HttpServer._instance) throw new Error('HttpServer is singleton');

        this.app = express();
        this.app.use(express.static('./public/'));

        this.setupViberFix();
        this.setupOriginHeaders();
    }

    public run() {
        this.app.listen(config.http.port, () => {
            console.log(`[HTTP] Server started on port ${config.http.port}`);
        });
    }

    private setupViberFix() {
        this.app.use((req, res, next) => {
            if (req.path.startsWith(config.viber.url)) return next()

            return express.json({})(req, res, next)
        })
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
