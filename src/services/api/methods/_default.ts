import { Request, Response } from 'express';
import { App } from '../../../app';

export type HandlerParams = {
    app: App,
    request: Request,
    response: Response
}

export default abstract class ApiDefaultMethod {
    public abstract readonly method: string;

    public abstract readonly httpMethod: 'GET' | 'POST';

    public watch: boolean = false;

    abstract handler(params: HandlerParams): Promise<any> | any

    unload() { }
}