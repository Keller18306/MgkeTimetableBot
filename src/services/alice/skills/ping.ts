import { IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

export default class extends AliceSkill {
    public id: string = 'ping';

    public matcher(ctx: IContext): boolean {
        return /ping|пинг/i.test(ctx.message);
    }

    public controller(ctx: IContext, user: AliceUser) { 
        return Reply.text('pong')
    }
}