import { IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { raspCache } from "../../../updater";
import { closestJaroWinkler } from "../../../utils";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

export default class extends AliceSkill {
    public id: string = 'my_teacher';

    public matcher(ctx: IContext): boolean | string {
        const teacher = ctx.message.match(/(?:(?:я (?:учитель|преподаватель))|(?:моя фамилия)) (.+?(?:\s[\W\w]){0,2}(?=[ ?.]|$))/i);
        if (!teacher) {
            return false;
        }

        return teacher[1].replace(',', '.');
    }

    public controller(ctx: IContext, user: AliceUser, match: string) {
        const result = closestJaroWinkler(match, Object.keys(raspCache.teachers.timetable), 0.6);
        if (!result) {
            return Reply.text('Простите, но я не нашла в базе такого преподавателя. Попробуйтся сказать медленнее и чётче.');
        }

        const teacher = result.value;

        user.mode = 'teacher'
        user.teacher = teacher
        user.group = null

        return Reply.text(
            `Я запомнила что вы преподаватель ${teacher}. Теперь, если вы будете запрашивать расписание без указание для кого именно, то я буду говорить именно ваше.`
        )
    }
}