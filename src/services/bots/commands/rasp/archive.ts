import { TelegramBotCommand } from "puregram/generated";
import db from "../../../../db";
import { dayIndexToDate, strDateToIndex } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)archive)(\b|$|\s)/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'archive',
        description: 'Архив расписания за прощедшие дни'
    };
    public scene?: string | null = null;

    async handler({ context, chat, scheduleFormatter }: HandlerParams) {
        const day: string | undefined = context.text?.replace(this.regexp, '').trim();
        if (!day) {
            return context.send('День не указан');
        }

        const dayIndex: number = strDateToIndex(day);

        let condition: string | undefined;
        let value: any | undefined;
        let type: 'teacher' | 'group';
        if (chat.mode === 'student' || chat.mode === 'parent') {
            condition = '`group` = ? AND `teacher` IS NULL';
            value = chat.group;
            type = 'group';
        } else if (chat.mode === 'teacher') {
            condition = '`group` IS NULL AND `teacher` = ?';
            value = chat.teacher;
            type = 'teacher';
        } else {
            //todo get from args
            return context.send(`Для данного режима чата (${chat.mode}) нельзя автоматически получить группу или учителя.`)
        }

        const entry = db.prepare('SELECT * FROM timetable_archive WHERE `day` = ? AND ' + condition).get(dayIndex, value) as any;
        if (!entry) {
            const minimalDayIndex: number = (db.prepare('SELECT MIN(`day`) as `day` FROM timetable_archive').get() as any).day;
            if (dayIndex < minimalDayIndex) {
                //todo another day format
                return context.send([
                    'Вы указали день, который находится вне периода сохранённых дней.',
                    `В базе хранятся дни, начиная с ${dayIndexToDate(minimalDayIndex)}`
                ].join('\n'));
            }

            return context.send('Ничего не найдено');
        }

        //entry.data
        //scheduleFormatter.formatGroupLessons()
        //scheduleFormatter.formatTeacherLessons()

        return context.send(JSON.stringify(entry, null, 1));
    }
}