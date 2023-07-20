import { TelegramBotCommand } from "puregram/generated";
import { config } from "../../../../../config";
import { raspCache } from "../../../../updater";
import { nowInTime } from "../../../../utils";
import { AbstractCommand, HandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^((!|\/)(get)?(times|calls)|(🕐\s)?звонки)$/i
    public payload = null;
    public tgCommand: TelegramBotCommand = {
        command: 'calls',
        description: 'Расписание звонков'
    };

    handler({ context, chat, actions }: HandlerParams) {
        actions.deleteUserMsg()

        const message: string[] = [];

        let maxLessons: number = Math.max(
            config.timetable.saturday.length,
            config.timetable.weekdays.length
        );

        if ((chat.mode === 'parent' || chat.mode === 'student') && chat.group) {
            const current: number = Math.max(...raspCache.groups
                .timetable[chat.group]?.days
                .map(_ => _.lessons.length) || []
            );

            maxLessons = current || maxLessons;
        } else if (chat.mode === 'teacher' && chat.teacher) {
            const current: number = Math.max(...raspCache.teachers
                .timetable[chat.teacher]?.days
                .map(_ => _.lessons.length) || []
            );

            maxLessons = current || maxLessons;
        }

        message.push('__ ЗВОНКИ (будни) __')
        for (let i = 0; i < maxLessons; i++) {
            const lesson = config.timetable.weekdays[i];
            if (!lesson) break;

            const lineStr: string = `${i + 1}. ${lesson[0][0]} - ${lesson[0][1]} | ${lesson[1][0]} - ${lesson[1][1]}`

            message.push(this.setSelected(lineStr, nowInTime([1, 2, 3, 4, 5], lesson[0][0], lesson[1][1])))
        }

        message.push('\n__ ЗВОНКИ (суббота) __')
        for (let i = 0; i < maxLessons; i++) {
            const lesson = config.timetable.saturday[i];
            if (!lesson) break;
            
            const lineStr: string = `${i + 1}. ${lesson[0][0]} - ${lesson[0][1]} | ${lesson[1][0]} - ${lesson[1][1]}`

            message.push(this.setSelected(lineStr, nowInTime([6], lesson[0][0], lesson[1][1])))
        }

        context.send(message.join('\n'))
    }

    private setSelected(text: string, selected: boolean): string {
        if (!selected) {
            return text;
        }

        return `👉 ${text} 👈`;
    }
}