import { z } from "zod";
import { config } from "../../../../config";
import { DayCall } from "../../../../config.scheme";
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

        let userMaxLessons: number;

        if (!showFull && current) {
            userMaxLessons = current;
        } else {
            userMaxLessons = maxLessons;
        }
        
        message.push('__ ЗВОНКИ (будни) __')
        message.push(this._getMessage(config.timetable.weekdays, [1, 2, 3, 4, 5], userMaxLessons, showFull));

        message.push('\n__ ЗВОНКИ (суббота) __')
        message.push(this._getMessage(config.timetable.saturday, [6], userMaxLessons, showFull));

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

    private _getMessage(calls: DayCall[], includedDays: number[], maxLessons: number, showFull: boolean) {
        const text: string[] = [];

        for (let i = 0; i < maxLessons; i++) {
            const lesson = calls[i];
            if (!lesson) break;

            const lineStr: string = `${i + 1}. ${lesson[0][0]} - ${lesson[0][1]} | ${lesson[1][0]} - ${lesson[1][1]}`;

            text.push(this.setSelected(lineStr, !showFull && nowInTime(includedDays, lesson[0][0], lesson[1][1])));
        }

        return text.join('\n');
    }
}