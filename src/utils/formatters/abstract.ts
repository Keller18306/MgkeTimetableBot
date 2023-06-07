import { AbstractChat } from "../../services/bots/abstract/chat";
import { Service } from "../../services/bots/abstract/command";
import { Updater } from "../../updater";
import { GroupDay, GroupLesson, GroupLessonExplain, TeacherDay, TeacherLesson, TeacherLessonExplain } from "../../updater/parser/types";
import { RaspCache, RaspGroupCache, RaspTeacherCache } from "../../updater/raspCache";
import { formatSeconds } from "../time";

export type InputFormatGroupOptions = {
    showHeader?: boolean,
    days?: GroupDay[]
}

export type InputFormatTeacherOptions = {
    showHeader?: boolean,
    days?: TeacherDay[]
}

export type FormatGroupOptions = {
    showHeader: boolean,
    days: GroupDay[]
}

export type FormatTeacherOptions = {
    showHeader: boolean,
    days: TeacherDay[]
}

export type GroupLessonOptions = {
    isMain: boolean,
    showSubgroup: boolean,
    showLesson: boolean,
    showType: boolean,
    showTeacher: boolean,
    showCabinet: boolean,
    showComment: boolean
}

export abstract class ScheduleFormatter {
    public abstract readonly label: string;

    constructor(
        private service: Service,
        protected raspCache: RaspCache,
        protected chat?: AbstractChat
    ) { }

    protected abstract formatGroupLesson(lesson: GroupLessonExplain, options: GroupLessonOptions): string;
    protected abstract formatTeacherLesson(lesson: TeacherLessonExplain): string;

    protected abstract GroupHeader(group: string): string;
    protected abstract TeacherHeader(group: string): string;
    protected abstract DayHeader(day: string, weekday: string): string;
    protected abstract LessonHeader(i: number): string;
    protected abstract Subgroup(subgroup: string): string;
    protected abstract Lesson(lesson: string): string;
    protected abstract Type(type: string): string;
    protected abstract Group(group: string): string;
    protected abstract Teacher(teacher: string): string;
    protected abstract Cabinet(cabinet: string): string;
    protected abstract Comment(comment: string): string;
    protected abstract NoLessons(): string;

    public formatGroupFull(group: string, _options?: InputFormatGroupOptions): string {
        const options = this.getDefaultFormatGroupOptions(_options, group);

        const text: string[] = []
        if (options.showHeader) {
            text.push(this.GroupHeader(group))
        }

        for (const day of options.days) {
            text.push([
                this.DayHeader(day.day, day.weekday),
                this.formatGroupLessons(day.lessons)
            ].join('\n'))
        }

        text.push(this.footer(this.raspCache.groups))

        return text.join('\n\n')
    }

    public formatTeacherFull(teacher: string, _options?: InputFormatTeacherOptions | undefined): string {
        const options = this.getDefaultFormatTeacherOptions(_options, teacher);

        const text: string[] = []
        if (options.showHeader) {
            text.push(this.TeacherHeader(teacher))
        }

        for (const day of options.days) {
            text.push([
                this.DayHeader(day.day, day.weekday),
                this.formatTeacherLessons(day.lessons)
            ].join('\n'))
        }

        text.push(this.footer(this.raspCache.teachers));

        return text.join('\n\n')
    }

    public formatGroupLessons(lessons: GroupLesson[]): string {
        if (!lessons.length) {
            return this.NoLessons();
        }

        const text: string[] = [];

        for (const i in lessons) {
            const lesson = lessons[i]
            if (lesson == null) continue;

            const cab: string[] = [
                this.LessonHeader(+i)
            ];

            if (!lesson) {
                text.push(cab.join(''));
                continue;
            }

            const subs = Array.isArray(lesson) ? lesson : [lesson];
            const isSubs = Array.isArray(lesson)

            const lessonsEqual: boolean = subs.every(_ => _.lesson === subs[0].lesson);
            const typeEqual: boolean = lessonsEqual && subs.every(_ => _.type === subs[0].type);
            const teacherEqual: boolean = subs.length > 1 && typeEqual && subs.every(_ => _.teacher === subs[0].teacher);
            const cabinetEqual: boolean = teacherEqual && subs.every(_ => _.cabinet === subs[0].cabinet);
            const commentEqual: boolean = subs.every(_ => _.comment === subs[0].comment);

            const options: GroupLessonOptions = {
                isMain: true,
                showSubgroup: !isSubs,
                showLesson: !isSubs || lessonsEqual,
                showType: !isSubs || typeEqual,
                showTeacher: !isSubs || teacherEqual,
                showCabinet: !isSubs || cabinetEqual,
                showComment: !isSubs || commentEqual,
            }

            const reversedOptions = Object.fromEntries(Object.entries(options).map(([key, value]) => {
                return [key, !value]
            })) as GroupLessonOptions;

            const mainLessons = this.formatGroupLesson(subs[0], options)
            if (mainLessons) {
                cab.push(mainLessons);
            }

            text.push(cab.join(' '));

            if (isSubs) {
                const lines: string[] = subs.map((lesson: GroupLessonExplain, i: number): string => {
                    let line: string = this.formatGroupLesson(lesson, reversedOptions)

                    if (i === subs.length - 1) {
                        line = '└── ' + line;
                    } else {
                        line = '├── ' + line;
                    }
                    // if (i > 0) {
                    //     line = '\n' + line;
                    // }

                    return line;
                });

                text.push(lines.join('\n'));
            }
        }

        return text.join('\n')
    }

    public formatTeacherLessons(lessons: TeacherLesson[]): string {
        if (!lessons.length) {
            return this.NoLessons();
        }

        const text: string[] = []

        for (const i in lessons) {
            const lesson = lessons[i]
            if (lesson == null) continue;

            text.push([
                this.LessonHeader(+i),
                this.formatTeacherLesson(lesson)
            ].join(''));
        }

        return text.join('\n')
    }

    protected getDefaultFormatGroupOptions(options: InputFormatGroupOptions | undefined, group: string): FormatGroupOptions {
        return Object.assign({}, {
            showHeader: false,
            days: this.raspCache.groups.timetable[group].days
        }, options)
    }

    protected getDefaultFormatTeacherOptions(options: InputFormatTeacherOptions | undefined, teacher: string): FormatTeacherOptions {
        return Object.assign({}, {
            showHeader: false,
            days: this.raspCache.teachers.timetable[teacher].days
        }, options)
    }

    protected footer(rasp: RaspGroupCache | RaspTeacherCache) {
        const text: string[] = []

        if (this.chat && this.chat.showParserTime) {
            text.push(`Информация была загружена ${formatSeconds(Math.ceil((Date.now() - rasp.update) / 1e3))} назад`)
        }

        if (Updater.getInstance().isHasErrors()) {
            text.push('⚠️ В последний раз при получении расписания с сайта произошла ошибка. Есть вероятность, что расписание не актуальное. Если проблема не исчезнет - сообщите разработчику.')
        }

        return text.join('\n\n')
    }

    protected b(text: string): string {
        if (this.service === 'tg') {
            return `<b>${text}</b>`;
        }

        return text;
    }

    protected i(text: string): string {
        if (this.service === 'tg') {
            return `<i>${text}</i>`;
        }

        return text;
    }

    protected u(text: string): string {
        if (this.service === 'tg') {
            return `<u>${text}</u>`;
        }

        return text;
    }

    protected s(text: string): string {
        if (this.service === 'tg') {
            return `<s>${text}</s>`;
        }

        return text;
    }

    protected m(text: string): string {
        if (this.service === 'tg') {
            return `<code>${text}</code>`;
        }

        return text;
    }
}