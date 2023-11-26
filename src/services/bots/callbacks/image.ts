import { Updater, raspCache } from "../../../updater";
import { getDayIndex, getWeekIndex, weekBoundsByWeekIndex } from "../../../utils";
import { ImageBuilder, ImageFile } from "../../image/builder";
import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'image';

    async handler({ context }: CbHandlerParams) {
        const [type, value] = context.payload;
        if (!type || !value) return;

        const weekIndex: number = context.payload[2] || raspCache.groups.lastWeekIndex || getWeekIndex();
        const weekBounds = weekBoundsByWeekIndex(weekIndex).map(getDayIndex) as [number, number];

        let image: ImageFile | undefined;
        if (['g', 'group'].includes(type)) {
            const rasp = raspCache.groups.timetable[value];
            if (!rasp) return context.answer('Данной учебной группы не существует');

            const days = Updater.getInstance().archive.getGroupDaysByBounds(weekBounds, value);
            if (!days.length) {
                return context.answer('Нет расписания для отображения');
            }

            image = await ImageBuilder.getGroupImage(value, days);
        }

        if (['t', 'teacher'].includes(type)) {
            const rasp = raspCache.teachers.timetable[value];
            if (!rasp) return context.answer('Данного преподавателя не существует');

            const days = Updater.getInstance().archive.getTeacherDaysByBounds(weekBounds, value);
            if (!days.length) {
                return context.answer('Нет расписания для отображения');
            }

            image = await ImageBuilder.getTeacherImage(value, days);
        }

        if (!image) return context.answer('Невозможно создать изображение');

        await context.sendPhoto(image, {
            reply_to: context.messageId
        });

        return context.answer('Изображение было отправлено').catch(() => { });
    }
}