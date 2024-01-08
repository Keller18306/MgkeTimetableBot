import { Updater, raspCache } from "../../../updater";
import { WeekIndex, removePastDays } from "../../../utils";
import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'timetable';

    handler(params: CbHandlerParams) {
        const { context, chat }: CbHandlerParams = params;

        const type: string = context.payload[0];
        const value: string | number = context.payload[1];
        const weekIndex: number = context.payload[2] || WeekIndex.getRelevant().valueOf();
        const hidePastDays: boolean = context.payload[3] !== undefined ? context.payload[3] : chat.hidePastDays;
        const showHeader: boolean = Boolean(context.payload[4]);

        if (['g', 'group'].includes(type)) {
            return this.groupRasp(params, value, weekIndex, hidePastDays, showHeader);
        }

        if (['t', 'teacher'].includes(type)) {
            return this.teacherRasp(params, String(value), weekIndex, hidePastDays, showHeader);
        }

        return context.edit('unknown type');
    }

    private async groupRasp({ context, scheduleFormatter, keyboard }: CbHandlerParams, value: string | number, weekIndex: number, hidePastDays: boolean, showHeader: boolean) {
        const group = raspCache.groups.timetable[value];
        if (group === undefined) return context.edit('Данной учебной группы не существует');

        const relevantWeekIndex: number = WeekIndex.getRelevant().valueOf();
        const weekBounds = WeekIndex.fromWeekIndexNumber(weekIndex).getWeekDayIndexRange();

        let days = Updater.getInstance().archive.getGroupDaysByRange(weekBounds, value);
        if (weekIndex === relevantWeekIndex && hidePastDays) {
            days = removePastDays(days);
        }

        const message = scheduleFormatter.formatGroupFull(String(value), {
            showHeader, days
        });

        return context.edit(message, {
            keyboard: keyboard.WeekControl('group', value, weekIndex, hidePastDays, showHeader)
        });
    }

    private async teacherRasp({ context, scheduleFormatter, keyboard }: CbHandlerParams, value: string, weekIndex: number, hidePastDays: boolean, showHeader: boolean) {
        const teacher = raspCache.teachers.timetable[value];
        if (teacher === undefined) return context.edit('Данного преподавателя не существует');

        const relevantWeekIndex: number = WeekIndex.getRelevant().valueOf();
        const weekBounds = WeekIndex.fromWeekIndexNumber(weekIndex).getWeekDayIndexRange();

        let days = Updater.getInstance().archive.getTeacherDaysByRange(weekBounds, value);
        if (weekIndex === relevantWeekIndex && hidePastDays) {
            days = removePastDays(days);
        }

        const message = scheduleFormatter.formatTeacherFull(value, {
            showHeader, days
        });

        return context.edit(message, {
            keyboard: keyboard.WeekControl('teacher', value, weekIndex, hidePastDays, showHeader)
        });
    }
}