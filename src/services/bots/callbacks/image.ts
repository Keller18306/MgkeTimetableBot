import { raspCache } from "../../../updater";
import { ImageBuilder, ImageFile } from "../../image/builder";
import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'image';

    async handler({ context }: CbHandlerParams) {
        const [type, value] = context.payload;
        if (!type || !value) return;
        //TODO gen by week index (bounds) -> requires rewrite image builder

        let image: ImageFile | undefined;
        if (type === 'group') {
            const rasp = raspCache.groups.timetable[value];
            if (!rasp) return;

            image = await ImageBuilder.getGroupImage(rasp);
        } else if (type === 'teacher') {
            const rasp = raspCache.teachers.timetable[value];
            if (!rasp) return;

            image = await ImageBuilder.getTeacherImage(rasp);
        }

        if (!image) return;

        await context.sendPhoto(image, {
            reply_to: context.messageId
        });

        return context.answer('Изображение было отправлено').catch(() => { });
    }
}