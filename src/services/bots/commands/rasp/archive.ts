import { TelegramBotCommand } from "puregram/generated";
import { Updater } from "../../../../updater";
import { GroupLesson, TeacherLesson } from "../../../../updater/parser/types";
import { dayIndexToDate, formatDate, strDateToIndex } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";

const archive = Updater.getInstance().archive;

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

        let entry: GroupLesson[] | TeacherLesson[] | null = null;
        let text: string;
        if (chat.mode === 'student' || chat.mode === 'parent') {
            if (chat.group == null) {
                return context.send(`Для данного чата группа не была выбрана.`);
            }

            entry = archive.getGroupDay(dayIndex, chat.group);
            text = scheduleFormatter.formatGroupLessons(entry);
        } else if (chat.mode === 'teacher') {
            if (chat.teacher == null) {
                return context.send(`Для данного чата учитель не был выбран.`);
            }

            entry = archive.getTeacherDay(dayIndex, chat.teacher);
            text = scheduleFormatter.formatTeacherLessons(entry);
        } else {
            //todo get from args
            return context.send(`Для данного режима чата (${chat.mode}) нельзя автоматически получить группу или учителя.`);
        }

        if (!entry) {
            const { min: minDayIndex, max: maxDayIndex } = archive.getDayIndexBounds();
            
            if (dayIndex < minDayIndex || dayIndex > maxDayIndex) {
                const fromDay = formatDate(dayIndexToDate(minDayIndex));
                const toDay = formatDate(dayIndexToDate(maxDayIndex));

                //todo another day format
                return context.send([
                    'Вы указали день, который находится вне периода сохранённых дней.',
                    `В базе хранятся дни, начиная с ${fromDay} по ${toDay}`
                ].join('\n'));
            }

            return context.send('Ничего не найдено на данный день');
        }

        text = scheduleFormatter.formatDayHeader(formatDate(dayIndexToDate(dayIndex))) + '\n' + text;

        return context.send(text);
    }
}