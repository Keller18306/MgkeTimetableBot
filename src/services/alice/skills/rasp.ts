import { IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { DefaultScheduleFormatter } from "../../../formatter";
import { StringDate, closestJaroWinkler, getDayRasp, getFullSubjectName } from "../../../utils";
import { raspCache } from "../../parser";
import { GroupDay, TeacherDay } from "../../parser/types";
import { AliceSkill } from "../skill";
import { AliceUser } from "../user";

type MatchResult = {
    day?: string,
    group?: string,
    teacher?: string
}

export default class extends AliceSkill {
    public id: string = 'rasp';

    public matcher(ctx: IContext): MatchResult | false {
        if (['расписание', 'мои пары', 'мое расписание'].includes(ctx.message)) {
            return {}
        }

        if (['сегодня', 'завтра'].includes(ctx.message)) {
            return {
                day: ctx.message
            }
        }

        if (!/((моё )?расписание|(мои )?(пары|уроки))\ (на|для|группы|преподавателя|учителя)/i.test(ctx.message)) {
            return false;
        }

        const day = ctx.message.match(/на\ (.+?(?=[ ?.]|$))/i);

        const group = (
            ctx.message.match(/для (\d+)(\s\-\sей)? группы/i) ||
            ctx.message.match(/на (\d+) группу/i) ||
            ctx.message.match(/группы (\d+)/i)
        );

        const teacher = (
            ctx.message.match(/(?:для )?(?:учителя|преподавателя) (.+?(?:\s\w){0,2}(?=[ ?.]|$))/i)
        );

        return {
            day: day?.[1],
            group: group?.[1],
            teacher: teacher?.[1]
        };
    }

    public controller(ctx: IContext, user: AliceUser, matched: MatchResult) {
        if (matched.group && matched.teacher) {
            return Reply.text('Скажите пожалуйста что-то одно. Я не могу сразу назвать расписание для группы и для преподавателя.');
        }

        if (!matched.group && !matched.teacher) {
            if (user.mode !== null) {
                if (user.mode === 'group' && user.group) {
                    return this.groupRasp(user.group, matched.day, false);
                }

                if (user.mode === 'teacher' && user.teacher) {
                    return this.teacherRasp(user.teacher, matched.day, false);
                }
            }
        }

        if (matched.group) {
            return this.groupRasp(matched.group, matched.day, true);
        }

        if (matched.teacher) {
            return this.teacherRasp(matched.teacher, matched.day, true);
        }

        return Reply.text('Вам необходимо сказать для какой группы или преподавателя вы хотите узнать расписание. Если же вы хотите, чтобы я запомнила, из какой вы группы или преподаватель - скажите мне и я запомню.')
    }

    private groupRasp(group: string, matched: string | undefined, showGroup: boolean) {
        const groupRasp = raspCache.groups.timetable[group];
        if (!groupRasp) {
            return Reply.text('Извините, но данной группы нет у меня в базе.')
        }

        const day = this.getDay(matched, groupRasp.days);
        if (day === false) {
            return Reply.text('Простите, но я не поняла, на какой день вы хотите получить расписание')
        }
        if (!day) {
            return Reply.text('Я не смогла найти указанный день')
        }

        const weekday: string = StringDate.fromStringDate(day.day).getWeekdayName();

        const tts: string[] = [];
        tts.push(`Расписание на ${weekday}${showGroup ? ` для ${group}-ей группы` : ''}`)

        let firstLesson: number | null = null;
        for (const i in day.lessons) {
            const lesson = day.lessons[i];

            if (!lesson) {
                continue;
            }

            if (firstLesson === null) {
                firstLesson = +i + 1
                if (firstLesson > 1) {
                    tts.push(`Начало с ${firstLesson}-й пары`)
                }
            }

            tts.push(`${+i + 1}-ая пара:`)

            if (!Array.isArray(lesson)) {
                tts.push(getFullSubjectName(lesson.lesson))
            } else {
                if (lesson.length === 1) {
                    const sub = lesson[0];
                    tts.push(`Только ${sub.subgroup}-я подгруппа ${getFullSubjectName(sub.lesson)}`)
                } else {
                    const isEqual = lesson.every(_ => _.lesson === lesson[0].lesson);

                    if (isEqual) {
                        tts.push(getFullSubjectName(lesson[0].lesson) + ' для всех подгрупп');
                    } else {
                        for (const sub of lesson) {
                            tts.push(`${sub.subgroup}-я подгруппа ${getFullSubjectName(sub.lesson)}`)
                        }
                    }
                }

            }
        }

        if (!day.lessons.length) {
            tts.push('Пар нет')
        }

        const text: string[] = [];
        text.push(`Расписание на ${weekday}, ${day.day}${showGroup ? ` для ${group}-ей группы` : ''}:`);

        const formatter = new DefaultScheduleFormatter('alice', this.app, raspCache);
        text.push(formatter.formatGroupLessons(day.lessons));

        return Reply.text(text.join('\n'), {
            tts: tts.join('. ')
        });
    }

    private teacherRasp(teacher: string, matched: string | undefined, showTeacher: boolean) {
        const result = closestJaroWinkler(teacher, Object.keys(raspCache.teachers.timetable), 0.6);
        if (!result) {
            return Reply.text('Простите, но я не нашла в базе такого преподавателя. Попробуйтся сказать медленнее и чётче.');
        }

        console.log(teacher, result);
        teacher = result.value;
        const day = this.getDay(matched, raspCache.teachers.timetable[teacher].days);
        if (day === false) {
            return Reply.text('Простите, но я не поняла, на какой день вы хотите получить расписание')
        }
        if (!day) {
            return Reply.text('Я не смогла найти указанный день')
        }

        const weekday: string = StringDate.fromStringDate(day.day).getWeekdayName();

        const tts: string[] = [];
        tts.push(`Расписание на ${weekday}${showTeacher ? ` для преподавателя "${teacher}"` : ''}`)

        let firstLesson: number | null = null;
        for (const i in day.lessons) {
            const lesson = day.lessons[i];

            if (!lesson) {
                continue;
            }

            if (firstLesson === null) {
                firstLesson = +i + 1
                if (firstLesson > 1) {
                    tts.push(`Уроки начинаются с ${firstLesson}-й пары`)
                }
            }

            tts.push(`${+i + 1}-ая пара:`)

            let value: string;
            if (lesson.subgroup) {
                value = `Группа ${lesson.group}. ${lesson.subgroup}-я подгруппа`;
            } else {
                value = `${lesson.group}-я группа`;
            }

            tts.push(value + ' ' + getFullSubjectName(lesson.lesson))
        }

        if (!day.lessons.length) {
            tts.push('Пар нет')
        }

        const text: string[] = [];
        text.push(`Расписание на ${weekday}, ${day.day}${showTeacher ? ` для преподавателя "${teacher}"` : ''}:`);

        const formatter = new DefaultScheduleFormatter('alice', this.app, raspCache);
        text.push(formatter.formatTeacherLessons(day.lessons));

        return Reply.text(text.join('\n'), {
            tts: tts.join('. ')
        });
    }

    private getDay<T extends GroupDay | TeacherDay>(matched: string | undefined, days: T[]): T | false | null | undefined {
        // const date = getTodayDate();

        switch (matched) {
            case undefined:
                return getDayRasp(days, true)[0];
            case 'сегодня':
                return getDayRasp(days, false)[0];
            case 'завтра':
                return getDayRasp(days, false)[1];
            case 'понедельник':
            case 'вторник':
            case 'среда':
            case 'среду':
            case 'четверг':
            case 'пятница':
            case 'пятницу':
            case 'суббота':
            case 'субботу':
                if (matched === 'среду') {
                    matched = 'среда'
                }

                if (matched === 'пятницу') {
                    matched = 'пятница'
                }

                if (matched === 'субботу') {
                    matched = 'суббота'
                }

                return days
                    .find(_ => StringDate.fromStringDate(_.day).getWeekdayName().toLowerCase() === matched)
            default:
                return false;
        }
    }
}