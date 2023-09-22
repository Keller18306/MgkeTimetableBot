import { IContext, Reply, Markup } from "@keller18306/yandex-dialogs-sdk";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

export default class extends AliceSkill {
    public id: string = 'start';

    public matcher(ctx: IContext): boolean {
        return ctx.message === '';
    }

    public controller(ctx: IContext, user: AliceUser) {
        const buttons: string[] = [];

        // if (!user.mode) {
        //     buttons.push('Настроить расписание')
        // } else {
        //     buttons.push('Моё расписание')
        // }

        // buttons.push('Расскажи о себе')

        return Reply.text('С возвращением. Чем могу помочь?', {
            buttons: buttons.map(title => {
                return Markup.button(title)
            })
        })
    }
}