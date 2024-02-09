import { IApiResponse, IApiResponseBody, IContext } from "@keller18306/yandex-dialogs-sdk";
import { AliceUser } from "./user";
import { App } from "../../app";

export abstract class AliceSkill {
    public abstract id: string;

    public abstract matcher(ctx: IContext): any;

    public abstract controller(ctx: IContext, user: AliceUser, match?: any): IApiResponseBody | Promise<IApiResponseBody>;

    constructor(protected app: App) {}
}