import { IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

export default class extends AliceSkill {
    public id: string = 'about';

    public matcher(ctx: IContext): boolean {
        return /расскажи(\sнам)? о себе/i.test(ctx.message);
    }

    public controller(ctx: IContext, user: AliceUser) {
        const text = [
            'Всех приветствую в этом зале! Очень рада сегодня присутствовать с вами.',
            'Как вы уже могли понять, я - Алиса. Ваш голосовой помощник.',
            'Меня Алексей научил получать расписание к+оледжа с сайта, и сообщать его вам.',
            'Изначально я создавалась как тестовый проект, но в итоге меня будут использовать люди с нарушением зрения.',
            'Ведь они не могут также хорошо ориентироваться в мессенджерах и сайтах, как мы.',
            'Разработка ещё ведётся, но я уже могу продемонстрировать то, что могу.',
            'Алексей, вам слово.'
        ].join('\n');

        return Reply.text(text.replace(/\+/ig, ''), {
            tts: text
        })
    }
}