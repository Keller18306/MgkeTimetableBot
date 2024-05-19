import { z } from "zod";
import { config } from "../../../../config";
import { nowInTime } from "../../../utils";
import { raspCache } from "../../parser";
import { AbstractCallback, ButtonType, CbHandlerParams, CmdHandlerParams } from "../abstract";

export default class CallsCallback extends AbstractCallback {
    public payloadAction: string = 'calls';

    async handler({ context, chat, keyboard }: CbHandlerParams | CmdHandlerParams) {
        let [showFull] = z.tuple([
            z.coerce.boolean()
        ]).parse(context.payload ?? [false]);

        const message: string[] = [];

        let maxLessons: number = Math.max(
            config.timetable.saturday.length,
            config.timetable.weekdays.length
        );

        let current: number | undefined;

        if ((chat.mode === 'parent' || chat.mode === 'student') && chat.group) {
            current = Math.max(...raspCache.groups
                .timetable[chat.group]?.days
                .map(_ => _.lessons.length) || []
            );
        } else if (chat.mode === 'teacher' && chat.teacher) {
            current = Math.max(...raspCache.teachers
                .timetable[chat.teacher]?.days
                .map(_ => _.lessons.length) || []
            );
        }

        if (!showFull && current) {
            maxLessons = current;
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

        if (current && current >= maxLessons) {
            showFull = true;
        }

        return context.editOrSend(message.join('\n'), {
            keyboard: showFull ? undefined : keyboard.getKeyboardBuilder('CallsFull', true).add({
                type: ButtonType.Callback,
                text: 'Показать полностью',
                payload: this.payloadAction + JSON.stringify([
                    Number(true)
                ])
            })
        });
    }

    private setSelected(text: string, selected: boolean): string {
        if (!selected) {
            return text;
        }

        return `👉 ${text} 👈`;
    }
}