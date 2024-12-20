import { config } from "../config";

export class Logger {
    constructor(private loggerName: string) { }

    public extend(extendName: string): Logger {
        return new Logger(this.loggerName + ':' + extendName);
    }

    public log(...message: any[]) {
        console.log(new Date(), '-', `[${this.loggerName}]`, ...message);
    }

    public debug(...message: any[]) {
        if (config.dev) {
            this.log(...message);
        }
    }

    public error(...message: any[]) {
        console.error(new Date(), '-', `[${this.loggerName}]`, ...message);
    }
}