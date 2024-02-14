import { z } from "zod";
import { WeekIndex, removePastDays } from "../../../utils";
import { raspCache } from "../../parser";
import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'timetable';

    handler(params: CbHandlerParams) {
        const { context, chat }: CbHandlerParams = params;

        const [type, value, weekIndex, hidePastDays, showHeader] = z.tuple([
            z.enum(['g', 'group', 't', 'teacher']),
            z.coerce.string(),
            z.number().int().nullish().transform((arg) => {
                if (!arg) {
                    return WeekIndex.getRelevant().valueOf();
                }

                return arg;
            }),
            z.coerce.boolean().default(Boolean(chat.hidePastDays)),
            z.coerce.boolean().default(true)
        ]).parse(context.payload);

        if (['g', 'group'].includes(type)) {
            return this.groupRasp(params, value, weekIndex, hidePastDays, showHeader);
        }

        if (['t', 'teacher'].includes(type)) {
            return this.teacherRasp(params, value, weekIndex, hidePastDays, showHeader);
        }

        return context.editOrSend('unknown type');
    }

    private async groupRasp({ context, scheduleFormatter, keyboard }: CbHandlerParams, value: string | number, weekIndex: number, hidePastDays: boolean, showHeader: boolean) {
        const group = raspCache.groups.timetable[value];
        if (group === undefined) return context.editOrSend('Данной учебной группы не существует');

        const relevantWeekIndex: number = WeekIndex.getRelevant().valueOf();
        const weekBounds = WeekIndex.fromWeekIndexNumber(weekIndex).getWeekDayIndexRange();

        let days = this.app.getService('timetable').getGroupDaysByRange(weekBounds, value);
        if (weekIndex === relevantWeekIndex && hidePastDays) {
            days = removePastDays(days);
        }

        const message = scheduleFormatter.formatGroupFull(String(value), {
            showHeader, days
        });

        return context.editOrSend(message, {
            keyboard: keyboard.WeekControl('group', value, weekIndex, hidePastDays, showHeader)
        });
    }

    private async teacherRasp({ context, scheduleFormatter, keyboard }: CbHandlerParams, value: string, weekIndex: number, hidePastDays: boolean, showHeader: boolean) {
        const teacher = raspCache.teachers.timetable[value];
        if (teacher === undefined) return context.editOrSend('Данного преподавателя не существует');

        const relevantWeekIndex: number = WeekIndex.getRelevant().valueOf();
        const weekBounds = WeekIndex.fromWeekIndexNumber(weekIndex).getWeekDayIndexRange();

        let days = this.app.getService('timetable').getTeacherDaysByRange(weekBounds, value);
        if (weekIndex === relevantWeekIndex && hidePastDays) {
            days = removePastDays(days);
        }

        const message = scheduleFormatter.formatTeacherFull(value, {
            showHeader, days
        });

        return context.editOrSend(message, {
            keyboard: keyboard.WeekControl('teacher', value, weekIndex, hidePastDays, showHeader)
        });
    }
}