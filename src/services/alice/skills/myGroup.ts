import { IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { raspCache } from "../../../updater";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

export default class extends AliceSkill {
    public id: string = 'my_group';

    public matcher(ctx: IContext): boolean | string {
        const group = ctx.message.match(/(?:(?:моя|у меня) группа (?:номер )?(\d+))|(?:я из (\d+) группы)/i);
        if (!group) {
            return false;
        }

        return group[1] || group[2];
    }

    public controller(ctx: IContext, user: AliceUser, match: string) {
        if (!Object.keys(raspCache.groups.timetable).includes(match)) {
            return Reply.text('Извините, но данной группы нет у меня в базе.')
        }

        user.mode = 'group'
        user.group = match
        user.teacher = null

        return Reply.text(
            `Я запомнила что вы из ${match} группы. Теперь, если вы будете запрашивать расписание без указание для кого именно, то я буду говорить именно ваше.`
        )
    }
}