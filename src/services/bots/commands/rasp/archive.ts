import { TelegramBotCommand } from "puregram/generated";
import { DayIndex, StringDate } from "../../../../utils";
import { GroupDay, TeacherDay } from "../../../parser/types";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)archive)(\b|$|\s)/i;
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'archive',
        description: 'Архив расписания за прощедшие дни'
    };
    public scene?: string | null = null;

    async handler({ context, chat, formatter }: CmdHandlerParams) {
        const day: string | undefined = context.text?.replace(this.regexp, '').trim();
        if (!day) {
            return context.send('День не указан');
        }

        const archive = this.app.getService('timetable');
        const dayIndex: number = DayIndex.fromStringDate(day).valueOf();

        let entry: GroupDay | TeacherDay | null = null;
        let text: string;
        if (chat.mode === 'student' || chat.mode === 'parent') {
            if (chat.group == null) {
                return context.send(`Для данного чата группа не была выбрана.`);
            }

            entry = await archive.getGroupDay(dayIndex, chat.group);
            text = formatter.formatGroupLessons(entry?.lessons);
        } else if (chat.mode === 'teacher') {
            if (chat.teacher == null) {
                return context.send(`Для данного чата учитель не был выбран.`);
            }

            entry = await archive.getTeacherDay(dayIndex, chat.teacher);
            text = formatter.formatTeacherLessons(entry?.lessons);
        } else {
            //todo get from args
            return context.send(`Для данного режима чата (${chat.mode}) нельзя автоматически получить группу или учителя.`);
        }

        if (!entry) {
            const { min: minDayIndex, max: maxDayIndex } = await archive.getDayIndexBounds();
            
            if (dayIndex < minDayIndex || dayIndex > maxDayIndex) {
                const fromDay = StringDate.fromDayIndex(minDayIndex).toString();
                const toDay = StringDate.fromDayIndex(maxDayIndex).toString();

                //todo another day format
                return context.send([
                    'Вы указали день, который находится вне периода сохранённых дней.',
                    `В базе хранятся дни, начиная с ${fromDay} по ${toDay}`
                ].join('\n'));
            }

            return context.send('Ничего не найдено на данный день');
        }

        text = formatter.formatDayHeader(entry.day) + '\n' + text;

        return context.send(text);
    }
}