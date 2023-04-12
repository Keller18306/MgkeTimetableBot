import { Request, Response } from 'express';
import { VKAppUser } from "../user";

export type HandlerParams = {
    user: VKAppUser,
    request: Request,
    response: Response
}

export default abstract class VKAppDefaultMethod {
    public abstract readonly method: string;

    public abstract readonly httpMethod: 'GET' | 'POST';

    public watch: boolean = false;

    abstract handler(params: HandlerParams): Promise<any> | any

    unload() { }
}