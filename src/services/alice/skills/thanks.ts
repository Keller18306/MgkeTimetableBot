import { IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

export default class extends AliceSkill {
    public id: string = 'thanks';

    public matcher(ctx: IContext): boolean {
        return /спасибо/i.test(ctx.message);
    }

    public controller(ctx: IContext, user: AliceUser) {
        return Reply.text('Всегда пожалуйста! Обращайтесь если что, буду рада вам помочь', {
            end_session: true
        })
    }
}