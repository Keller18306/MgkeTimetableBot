import { config } from '../../config';
import { Updater } from '../updater';
import { GroupDay, GroupLesson, GroupLessonExplain, TeacherDay, TeacherLesson } from '../updater/parser/types';
import { raspCache } from '../updater/raspCache';
import { formatSeconds } from "./seconds2times";
import { getIsSaturday, getTodayDate, nowInTime, strDateToNumber } from './time';

type GroupLessonLineOptions = {
    showSubgroup: boolean,
    showLesson: boolean,
    showType: boolean,
    showTeacher: boolean,
    showCabinet: boolean,
    showComment: boolean
}

function buildGroupLessonLine(lesson: GroupLessonExplain, options?: GroupLessonLineOptions): string {
    options = Object.assign({
        showSubgroup: true,
        showLesson: true,
        showType: true,
        showTeacher: true,
        showCabinet: true,
        showComment: true
    }, options || {})

    const line: string[] = [];

    if (options.showSubgroup && lesson.subgroup != null) {
        line.push(lesson.subgroup + '.')
    }

    if (options.showLesson) {
        line.push(lesson.lesson);
    }

    if (options.showType) {
        line.push(`(${lesson.type})`);
    }

    if (options.showTeacher && lesson.teacher) {
        line.push(lesson.teacher);
    }

    if (options.showCabinet && lesson.cabinet != null) {
        line.push(`{${lesson.cabinet}}`)
    }

    if (options.showComment && lesson.comment != null) {
        line.push(`// ${lesson.comment}`)
    }

    return line.join(' ');
}

export function buildGroupsDaysText(lessons: GroupLesson[], skipEmptyLessons: boolean = true): string {
    if (!lessons.length) {
        return 'Пар нет';
    }

    const text: string[] = [];


    for (const i in lessons) {
        const lesson = lessons[i]
        if (skipEmptyLessons && lesson == null) continue;

        const cab: string[] = [
            `${+i + 1}.`
        ]

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

        const options: GroupLessonLineOptions = {
            showSubgroup: !isSubs,
            showLesson: !isSubs || lessonsEqual,
            showType: !isSubs || typeEqual,
            showTeacher: !isSubs || teacherEqual,
            showCabinet: !isSubs || cabinetEqual,
            showComment: !isSubs || commentEqual,
        }

        const reversedOptions = Object.fromEntries(Object.entries(options).map(([key, value]) => {
            return [key, !value]
        })) as GroupLessonLineOptions;

        cab.push(buildGroupLessonLine(subs[0], options));
        text.push(cab.join(' '));

        if (isSubs) {
            const lines: string[] = subs.map((lesson: GroupLessonExplain, i: number): string => {
                let line: string = buildGroupLessonLine(lesson, reversedOptions)

                if (i === subs.length - 1) {
                    line = '└── ' + line;
                } else {
                    line = '├──' + line;
                }

                return line;
            });

            text.push(...lines);
        }
    }

    return text.join('\n')
}

export function buildTeacherDaysText(lessons: TeacherLesson[], skipEmptyLessons: boolean = true): string {
    if (!lessons.length) {
        return 'Пар нет';
    }

    const text: string[] = []

    for (const i in lessons) {
        const lesson = lessons[i]
        if (skipEmptyLessons && lesson == null) continue;

        const cab: string[] = [
            `${+i + 1}.`
        ];

        if (lesson) {
            const value = `${lesson.group}-${lesson.lesson} (${lesson.type})`;
            cab.push(value);

            if (lesson.cabinet != null) {
                cab.push(`{${lesson.cabinet}}`);
            }

            if (lesson.comment) {
                cab.push(`// ${lesson.comment}`);
            }
        }

        text.push(
            cab.join(' ')
        );
    }

    return text.join('\n')
}

export function buildGroupTextRasp(group: string | number, days: GroupDay[], anotherGroup: boolean = true, showUpdateTime: boolean = false) {
    const daysTexts: string[] = []
    if (anotherGroup) daysTexts.push(`- Группа '${group}' -`)

    for (const day of days) {
        daysTexts.push([
            `__ ${day.weekday}, ${day.day} __`,
            buildGroupsDaysText(day.lessons)
        ].join('\n'))
    }

    if (showUpdateTime) {
        daysTexts.push(`Информация была загружена ${formatSeconds(Math.ceil((Date.now() - raspCache.groups.update) / 1e3))} назад`)
    }

    if (Updater.getInstance().isHasErrors()) {
        daysTexts.push('⚠️ В последний раз при получении расписания с сайта произошла ошибка. Есть вероятность, что расписание не актуальное. Если проблема не исчезнет - сообщите разработчику.')
    }

    return daysTexts.join('\n\n')
}

export function buildTeacherTextRasp(teacher: string, days: TeacherDay[], anotherTeacher: boolean = true, showUpdateTime: boolean = false) {
    const daysTexts: string[] = []
    if (anotherTeacher) daysTexts.push(`- Учитель '${teacher}' -`)

    for (const day of days) {
        daysTexts.push([
            `__ ${day.weekday}, ${day.day} __`,
            buildTeacherDaysText(day.lessons)
        ].join('\n'))
    }

    if (showUpdateTime) {
        daysTexts.push(`Информация была загружена ${formatSeconds(Math.ceil((Date.now() - raspCache.teachers.update) / 1e3))} назад`)
    }

    if (Updater.getInstance().isHasErrors()) {
        daysTexts.push('⚠️ В последний раз при получении расписания с сайта произошла ошибка. Есть вероятность, что расписание не актуальное. Если проблема не исчезнет - сообщите разработчику.')
    }

    return daysTexts.join('\n\n')
}

export function removePastDays<T extends GroupDay | TeacherDay>(days: T[]): T[] {
    const todayDate: number = getTodayDate();

    const dayIndex: number = days.findIndex(_ => {
        return strDateToNumber(_.day) >= todayDate;
    });

    if (dayIndex === -1) {
        throw new Error('nearest day not found')
    }

    return days.slice(dayIndex);
}

export function getDayRasp<T extends GroupDay | TeacherDay>(days: T[], processAutoskip: boolean = true): T[] {
    const isSaturday: boolean = getIsSaturday();
    const todayDate: number = getTodayDate();
    const showDays: T[] = [];

    const nextDays: T[] = removePastDays(days);

    if (processAutoskip) {
        //current day ended
        const currentDay = nextDays[0];
        const timetable = config.timetable[isSaturday ? 'saturday' : 'weekdays'];
        let todayLessons: number = currentDay.lessons.length;
        if (!todayLessons || todayLessons > timetable.length) {
            todayLessons = timetable.length;
        }

        const lastLessonTime: string = timetable[todayLessons - 1][1][1];

        if (
            strDateToNumber(currentDay.day) === todayDate &&
            !nowInTime(isSaturday ? [6] : [1, 2, 3, 4, 5], '00:00', lastLessonTime)
        ) {
            nextDays.splice(0, 1);
        }
    }

    showDays.push(nextDays[0]);
    if (nextDays.length > 1) {
        showDays.push(nextDays[1]);
    }

    return showDays;
}

export function getDayNext<T extends GroupDay | TeacherDay>(days: T[]): T | null {
    const todayDate: number = getTodayDate();

    const dayIndex: number = days.findIndex(_ => {
        return strDateToNumber(_.day) > todayDate;
    });

    if (dayIndex === -1) {
        return null;
    }

    const nextDays = days.slice(dayIndex);

    return nextDays[0];
}