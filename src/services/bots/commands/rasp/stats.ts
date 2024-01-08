import { TelegramBotCommand } from "puregram/generated";
import { Updater } from "../../../../updater";
import { GroupLessonExplain, TeacherLessonExplain } from "../../../../updater/parser/types";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

const archive = Updater.getInstance().archive;

export default class extends AbstractCommand {
    public regexp = /^(!|\/)stats$/i;
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'stats',
        description: 'Статистика пар'
    };
    public scene?: string | null = null;

    async handler({ context, chat }: CmdHandlerParams) {
        let message: string;

        if ((chat.mode === 'student' || chat.mode === 'parent') && chat.group) {
            message = this.getGroupStats(chat.group);
        } else if(chat.mode === 'teacher' && chat.teacher) {
            message = this.getTeacherStats(chat.teacher);
        } else {
            message = 'Группа или учитель не были выбраны';
        }

        return context.send(message);
    }

    private getGroupStats(group: string | number) {
        const message: string[] = [];

        const days = archive.iterateGroupDays(group);

        const total: {
            [lesson: string]: number
        } = {}

        const appendStats = (explain: GroupLessonExplain) => {
            let value: string[] = [];

            if (explain.subgroup) {
                value.push(`${explain.subgroup}.`);
            }

            value.push(explain.lesson);

            if (explain.type) {
                value.push(`(${explain.type})`);
            }

            if (explain.comment) {
                value.push(`// ${explain.comment}`);
            }

            const key = value.join(' ');
            if (!total[key]) {
                total[key] = 0;
            }

            total[key] += 1;
        }

        for (const day of days) {
            for (const lesson of day.lessons) {
                const lessonExplain = Array.isArray(lesson) ? lesson : [lesson];

                for (const explain of lessonExplain) {
                    if (!explain) {
                        continue;
                    }

                    appendStats(explain);
                }
            }
        }

        message.push('Статистика пар за всё время:');
        message.push(Object.entries(total).sort(function (a, b) {
            return b[1] - a[1];
        }).map(([key, value], index) => {
            return `${key} - ${value} пар`;
        }).join('\n'));

        const totalCount = Object.values(total).reduce((total, amount) => {
            total += amount;

            return total;
        }, 0);

        message.push(`\nИтого всего пар (${Object.keys(total).length} предметов): ${totalCount}`);

        return message.join('\n');
    }

    private getTeacherStats(teacher: string) {
        const message: string[] = [];

        const days = archive.iterateTeacherDays(teacher);

        const total: {
            [lesson: string]: number
        } = {}

        const appendStats = (explain: TeacherLessonExplain) => {
            let value: string[] = [];

            if (explain.group) {
                value.push(`${explain.group}.`);
            }

            value.push(explain.lesson);

            if (explain.type) {
                value.push(`(${explain.type})`);
            }

            if (explain.comment) {
                value.push(`// ${explain.comment}`);
            }

            const key = value.join(' ');
            if (!total[key]) {
                total[key] = 0;
            }

            total[key] += 1;
        }

        for (const day of days) {
            for (const lesson of day.lessons) {
                const lessonExplain = Array.isArray(lesson) ? lesson : [lesson];

                for (const explain of lessonExplain) {
                    if (!explain) {
                        continue;
                    }

                    appendStats(explain);
                }
            }
        }

        message.push('Статистика пар за всё время:');
        message.push(Object.entries(total).sort(function (a, b) {
            return b[1] - a[1];
        }).map(([key, value], index) => {
            return `${key} - ${value} пар`;
        }).join('\n'));

        const totalCount = Object.values(total).reduce((total, amount) => {
            total += amount;

            return total;
        }, 0);

        message.push(`\nИтого всего пар (${Object.keys(total).length} предметов): ${totalCount}`);

        return message.join('\n');
    }
}