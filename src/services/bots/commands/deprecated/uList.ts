import db from "../../../../db";
import { DefaultCommand, HandlerParams, Service } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'u_list'

    public regexp = /^(!|\/)ulist$/i
    public payload = null;

    public services: Service[] = ['vk'];

    handler({ context, chat, service }: HandlerParams) {
        if (service != 'vk') throw new Error('Команда доступна только в ВК');
        const duty_student = chat.duty_student

        return;

        const users = db.prepare('SELECT * FROM `students` WHERE `peerId` = ?').all(context.peerId)

        const list: string[] = []
        for (const i in users) {
            const user = users[i]

            list.push(
                `[${+i == duty_student ? '=' : ''}] ${+i + 1}. ${user.vk_id !== null ? `[id${user.vk_id}|${user.name}]` : user.name} (${user.skip_count})`
            )
        }

        context.send(list.join('\n'), {
            disable_mentions: true
        })
    }
}