import { App, AppServiceName } from "../../app";
import { hints } from "../../defines";
import { AbstractChat } from "../../services/bots/abstract/chat";
import { RaspCache, RaspEntryCache } from "../../services/parser/raspCache";
import { GroupDay, GroupLesson, GroupLessonExplain, Groups, TeacherDay, TeacherLesson, TeacherLessonExplain, Teachers } from "../../services/timetable/types";
import { randArray } from "../rand";
import { DayIndex, StringDate, formatSeconds } from "../time";

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
    public static readonly label: string;

    constructor(
        private service: AppServiceName,
        private app: App,
        protected raspCache: RaspCache,
        protected chat?: AbstractChat
    ) { }

    protected abstract formatGroupLesson(lesson: GroupLessonExplain, options: GroupLessonOptions): string;
    protected abstract formatLessonHeader(header: string, mainLessons: string, withSubgroups: boolean): string;
    protected abstract formatSubgroupLesson(value: string, currentIndex: number, lastIndex: number): string;
    protected abstract formatTeacherLesson(lesson: TeacherLessonExplain): string;

    protected afterGroupLessonFormat?(lessons: GroupLessonExplain[]): string;
    protected afterTeacherLessonFormat?(lesson: TeacherLessonExplain): string;

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
    protected abstract NoTimetable(): string;

    public formatGroupFull(group: string, _options?: InputFormatGroupOptions): string {
        const options = this.getDefaultFormatGroupOptions(_options, group);

        const text: string[] = []
        if (options.showHeader) {
            text.push(this.GroupHeader(group))
        }

        if (options.days.length > 0) {
            for (const day of options.days) {
                text.push([
                    this.formatDayHeader(day.day),
                    this.formatGroupLessons(day.lessons)
                ].join('\n'));
            }
        } else {
            text.push(this.NoTimetable());
        }

        text.push(this.footer(this.raspCache.groups));

        return text.join('\n\n');
    }

    public formatTeacherFull(teacher: string, _options?: InputFormatTeacherOptions | undefined): string {
        const options = this.getDefaultFormatTeacherOptions(_options, teacher);

        const text: string[] = [];
        if (options.showHeader) {
            text.push(this.TeacherHeader(teacher));
        }

        if (options.days.length > 0) {
            for (const day of options.days) {
                text.push([
                    this.formatDayHeader(day.day),
                    this.formatTeacherLessons(day.lessons)
                ].join('\n'));
            }
        } else {
            text.push(this.NoTimetable());
        }

        text.push(this.footer(this.raspCache.teachers));

        return text.join('\n\n');
    }

    public formatDayHeader(day: string) {
        return this.DayHeader(day, StringDate.fromStringDate(day).getWeekdayName());
    }

    public formatGroupLessons(lessons?: GroupLesson[]): string {
        if (!lessons || !lessons.length) {
            return this.NoLessons();
        }

        const text: string[] = [];

        for (const i in lessons) {
            const lesson = lessons[i]
            if (lesson == null) continue;

            const lessonHeader = this.LessonHeader(+i);

            if (!lesson) {
                text.push(lessonHeader);
                continue;
            }

            const subs = Array.isArray(lesson) ? lesson : [lesson];
            const withSubgroups = Array.isArray(lesson)

            const lessonsEqual: boolean = subs.every(_ => _.lesson === subs[0].lesson);
            const typeEqual: boolean = lessonsEqual && subs.every(_ => _.type === subs[0].type);
            const teacherEqual: boolean = subs.length > 1 && typeEqual && subs.every(_ => _.teacher === subs[0].teacher);
            const cabinetEqual: boolean = teacherEqual && subs.every(_ => _.cabinet === subs[0].cabinet);
            const commentEqual: boolean = subs.every(_ => _.comment === subs[0].comment);

            const options: GroupLessonOptions = {
                isMain: true,
                showSubgroup: !withSubgroups,
                showLesson: !withSubgroups || lessonsEqual,
                showType: !withSubgroups || typeEqual,
                showTeacher: !withSubgroups || teacherEqual,
                showCabinet: !withSubgroups || cabinetEqual,
                showComment: !withSubgroups || commentEqual,
            }

            const reversedOptions = Object.fromEntries(Object.entries(options).map(([key, value]) => {
                return [key, !value]
            })) as GroupLessonOptions;

            const mainLessons = this.formatGroupLesson(subs[0], options)
            text.push(this.formatLessonHeader(lessonHeader, mainLessons, withSubgroups))

            if (withSubgroups) {
                const lines: string[] = subs.map((lesson: GroupLessonExplain, i: number): string => {
                    const value: string = this.formatGroupLesson(lesson, reversedOptions)

                    return this.formatSubgroupLesson(value, i, subs.length - 1);
                });

                text.push(lines.join('\n'));
            }

            if (this.afterGroupLessonFormat) {
                text.push(this.afterGroupLessonFormat(subs));
            }
        }

        return text.join('\n').trim();
    }

    public formatTeacherLessons(lessons?: TeacherLesson[]): string {
        if (!lessons || !lessons.length) {
            return this.NoLessons();
        }

        const text: string[] = []

        for (const i in lessons) {
            const lesson = lessons[i]
            if (lesson == null) continue;

            const header = this.LessonHeader(+i);
            const mainLessons = this.formatTeacherLesson(lesson);

            text.push(this.formatLessonHeader(header, mainLessons, false));

            if (this.afterTeacherLessonFormat) {
                text.push(this.afterTeacherLessonFormat(lesson));
            }
        }

        return text.join('\n').trim();
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

    protected footer(rasp: RaspEntryCache<Groups | Teachers>) {
        const text: string[] = []

        if (this.chat && this.chat.showParserTime) {
            text.push(`Информация была загружена ${formatSeconds(Math.ceil((Date.now() - rasp.update) / 1e3))} назад`)
        }

        if (this.app.getService('parser').isHasErrors()) {
            text.push('⚠️ В последний раз при получении расписания с сайта произошла ошибка. Есть вероятность, что расписание не актуальное. Если проблема не исчезнет - сообщите разработчику.')
        } else if (this.chat && this.chat.showHints) {
            text.push(`💬 Подсказка: ${randArray(hints)}`)
        }

        return text.join('\n\n')
    }

    protected getLessonAlias(lesson: string): string {
        if (!this.chat) {
            return lesson;
        }

        const aliases = this.chat.getLesonAliases();

        return aliases[lesson] ?? lesson;
    }

    protected getFullTeacherName(shortName: string): string {
        return this.raspCache.team.names[shortName] || shortName;
    }

    protected dayHint(day: string): string | undefined {
        const dayIndex = DayIndex.fromStringDate(day);

        if (dayIndex.isToday()) {
            return '(сегодня)';
        }

        if (dayIndex.isTomorrow()) {
            return '(завтра)';
        }

        return;
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