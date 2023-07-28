import { TelegramBotCommand } from "puregram/generated";
import { raspCache } from "../../../../updater";
import { getDayRasp } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)endings$/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'endings',
        description: 'Отображает сколько групп заканчивают к определённой паре'
    };
    public scene?: string | null = null;

    async handler({ context }: HandlerParams) {
        const groups = raspCache.groups.timetable;

        const stat: {
            [day: string]: {
                [lesson: number]: number
            }
        } = {}

        //todo subgroups
        for (const groupIndex in groups) {
            const group = groups[groupIndex];

            const days = getDayRasp(group.days, false);
            //const days = group.days.slice(0, 2); //test

            for (const entry of days) {
                const day = entry.day;
                const lessons = entry.lessons.length;

                if (lessons === 0) {
                    //нет пар у этой группы
                    continue;
                }

                if (stat[day] === undefined) {
                    stat[day] = {};
                }

                if (stat[day][lessons] === undefined) {
                    stat[day][lessons] = 0;
                }

                stat[day][lessons] += 1;
            }
        }

        if (Object.keys(stat).length === 0) {
            return context.send('Нет данных для отображения');
        }

        //await context.send(JSON.stringify(stat, null, 1));

        const message: string[] = [];
        for (const day in stat) {
            const part: string[] = [];

            part.push(`__ ${day} __`);

            for (const lesson in stat[day]) {
                const count = stat[day][lesson];

                part.push(`${count} групп заканчивают к ${lesson} паре`);
            }

            message.push(part.join('\n'));
        }

        return context.send(message.join('\n\n'))
    }
}