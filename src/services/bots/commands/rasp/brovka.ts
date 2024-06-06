import { MediaSource } from "puregram";
import { TelegramBotCommand } from "puregram/generated";
import { DayIndex, getFullSubjectName, StringDate } from "../../../../utils";
import { TeacherDay } from "../../../parser/types";
import { AbstractCommand, BotServiceName, CmdHandlerParams } from "../../abstract";
import { encode } from 'iconv-lite';

export default class extends AbstractCommand {
    public regexp = /^((!|\/)vychetkaDlyaBrovkiDSOnline)(\b|$|\s)/i;
    public payloadAction = null;
    public services: BotServiceName[] = ['tg'];
    public tgCommand: TelegramBotCommand = {
        command: 'vychetkaDlyaBrovkiDSOnline',
        description: 'Отображает сколько групп заканчивают к определённой паре'
    };
    public scene?: string | null = null;

    async handler({ service, context, realContext, chat, formatter }: CmdHandlerParams) {
        if (service !== 'tg') {
            return context.send('Не поддерживается данным сервисом');
        }

        const day: string | undefined = context.text?.replace(this.regexp, '').trim();
        if (!day) {
            return context.send('День, с которого необходимо начать не указан');
        }

        if (chat.mode !== 'teacher') {
            return context.send('Доступно только для режима чата "преподаватель".');
        }

        if (chat.teacher === null) {
            return context.send('Для данного чата учитель не был выбран.');
        }

        const archive = this.app.getService('timetable');
        const dayIndex: number = DayIndex.fromStringDate(day).valueOf();

        const entries: TeacherDay[] = await archive.getTeacherDays(chat.teacher, dayIndex);

        const lastDay = entries.at(-1);
        const maxDay = lastDay ? StringDate.fromStringDate(lastDay.day) : StringDate.now()

        const csv: string[] = [
            ['День', 'Подгруппа', 'Группа', 'Тип', 'Предмет'].join(',')
        ];

        for (const entry of entries) {
            const day = StringDate.fromStringDate(entry.day).toStringDateNoYear();

            for (const lesson of entry.lessons) {
                if (!lesson) {
                    continue;
                }

                csv.push([
                    day,
                    lesson.subgroup ?? '',
                    lesson.group,
                    lesson.type?.toUpperCase() ?? '-',
                    getFullSubjectName(lesson.lesson)
                ].join(','));
            }
        }

        const buffer = encode(csv.join('\n'), 'win1251');
        const source = MediaSource.buffer(buffer, {
            filename: `Вычетка c ${day} по ${maxDay.toStringDate()} (${Date.now()}).csv`
        });

        await realContext.replyWithDocument(source);
    }
}