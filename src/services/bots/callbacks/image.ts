import { z } from "zod";
import { AppServiceName } from "../../../app";
import { WeekIndex } from "../../../utils";
import { ImageFile } from "../../image/builder";
import { raspCache } from "../../parser";
import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public payloadAction: string = 'image';
    public requireServices: AppServiceName[] = ['image'];

    async handler({ context }: CbHandlerParams) {
        const [type, value, weekIndex] = z.tuple([
            z.enum(['g', 'group', 't', 'teacher']),
            z.coerce.string(),
            z.number().int().default(() => {
                return WeekIndex.getRelevant().valueOf();
            })
        ]).parse(context.payload);

        const weekBounds = WeekIndex.fromWeekIndexNumber(weekIndex).getWeekDayIndexRange();
        const archive = this.app.getService('timetable');

        let image: ImageFile | undefined;
        if (['g', 'group'].includes(type)) {
            const rasp = raspCache.groups.timetable[value];
            if (!rasp) return context.answer('Данной учебной группы не существует');

            const days = await archive.getGroupDaysByRange(weekBounds, value);
            if (!days.length) {
                return context.answer('Нет расписания для отображения');
            }

            image = await this.app.getService('image').builder.getGroupImage(value, days);
        }

        if (['t', 'teacher'].includes(type)) {
            const rasp = raspCache.teachers.timetable[value];
            if (!rasp) return context.answer('Данного преподавателя не существует');

            const days = await archive.getTeacherDaysByRange(weekBounds, value);
            if (!days.length) {
                return context.answer('Нет расписания для отображения');
            }

            image = await this.app.getService('image').builder.getTeacherImage(value, days);
        }

        if (!image) return context.answer('Невозможно создать изображение');

        await context.sendPhoto(image, {
            reply_to: context.messageId
        });

        return context.answer('Изображение было отправлено').catch(() => { });
    }
}