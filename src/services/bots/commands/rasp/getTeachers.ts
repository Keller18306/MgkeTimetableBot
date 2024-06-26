import { TelegramBotCommand } from "puregram/generated";
import { formatSeconds, sort } from "../../../../utils";
import { raspCache } from "../../../parser";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(get)?teachers$/i
    public payloadAction = null;
    public tgCommand: TelegramBotCommand = {
        command: 'teachers',
        description: 'Получить полный список преподавателей в кэше бота'
    };

    async handler({ context }: CmdHandlerParams) {
        const dbTeachers = await this.app.getService('timetable').getTeachers();
        const teachers = sort(dbTeachers).map(this.formatTeacher.bind(this, true));

        return context.send([
            '__ Преподаватели в кэше __',
            teachers.join('\n'),

            `\nЗагружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.teachers.update) / 1e3))} назад`,
            `Изменено: ${formatSeconds(Math.ceil((Date.now() - raspCache.teachers.changed) / 1e3))} назад`,

            '\n__ Страницы с учителями/администрацией __',
            `Загружено: ${formatSeconds(Math.ceil((Date.now() - raspCache.team.update) / 1e3))} назад`,
            `Изменено: ${formatSeconds(Math.ceil((Date.now() - raspCache.team.changed) / 1e3))} назад`
        ].join('\n'));
    }

    private formatTeacher(useFull: boolean, value: string | number, i: number) {
        const name = (useFull && raspCache.team.names[value]) ? raspCache.team.names[value] : value;

        return `${i + 1}. ${name}`;
    }
}