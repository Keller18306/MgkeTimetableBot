import db from '../../../../db';
import { sendTodayDuty, sendTomorrowDuty } from '../duter';
import { DefaultCallback, HandlerParams } from './_default';

export default class extends DefaultCallback {
    public id = 'skip';

    public action = 'skip';

    async handler({ context, chat, chatData }: HandlerParams) {
        if (chat.duty_student == null) throw new Error('duter is disabled')
        const user = db.prepare('SELECT * FROM `students` WHERE `peerId` = ? AND `vk_id` = ?').get(context.peerId, context.userId)

        if (!user || !user.has_access) return context.answer({ type: 'show_snackbar', text: '⛔ Доступ запрещён' })

        const users_count = db.prepare('SELECT COUNT(*) as `count` FROM `students` WHERE `peerId` = ?').get(chat.peerId).count

        const payload: {
            ui: number,
            action: string,
            type: 'today' | 'tomorrow',
            increment: boolean,
            again: boolean
        } = context.eventPayload

        let duty_id = chat.duty_student
        if (payload.type == 'tomorrow') duty_id++
        if (duty_id >= users_count) duty_id -= users_count

        const duty_user = db.prepare('SELECT * FROM `students` WHERE `peerId` = ? LIMIT 1 OFFSET ?').get(chat.peerId, duty_id)

        if (payload.ui != duty_user.id) return context.answer({ type: 'show_snackbar', text: 'Информация устарела' })

        const query: string[] = []
        if (payload.increment)
            if (payload.again) query.push('`skip_count` = `skip_count` + 2')
            else query.push('`skip_count` = `skip_count` + 1')

        query.push('`skip` = 1')

        db.prepare('UPDATE `students` SET ' + query.join(', ') + ' WHERE `id` = ?').run(duty_user.id)

        if (payload.type == 'today') {
            let next_id = duty_id + 1
            if (next_id >= users_count) next_id -= users_count

            chat.duty_student = next_id
        }

        context.answer({ type: 'show_snackbar', text: '✅ Информация изменена' })

        const hour = new Date().getHours()

        if (hour < 18) sendTodayDuty(chatData, false)
        else sendTomorrowDuty(chatData, false)
    }
}