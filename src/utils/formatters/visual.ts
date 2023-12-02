import { GroupLessonExplain, TeacherLessonExplain } from "../../updater/parser/types";
import { isToday, isTomorrow } from "../time";
import { GroupLessonOptions, ScheduleFormatter } from "./abstract";

export class VisualScheduleFormatter extends ScheduleFormatter {
    public static readonly label: string = '🌈 Визуальный';

    protected formatGroupLesson(lesson: GroupLessonExplain, options: GroupLessonOptions): string {
        const line: string[] = [];

        if (options.showSubgroup && lesson.subgroup != null) {
            line.push(this.Subgroup(`${lesson.subgroup}`));
        }

        if (options.showLesson) {
            line.push(this.Lesson(this.getLessonAlias(lesson.lesson)) + ((options.showType && lesson.type) ? this.Type(lesson.type) : ''));
        }

        if (options.showTeacher && lesson.teacher) {
            line.push(this.Teacher(lesson.teacher));
        }

        if (options.showCabinet && lesson.cabinet != null) {
            line.push(this.Cabinet(lesson.cabinet));
        }

        if (options.showComment && lesson.comment != null) {
            line.push(this.Comment(lesson.comment));
        }

        return line.join('\n');
    }

    protected formatTeacherLesson(lesson: TeacherLessonExplain): string {
        const line: string[] = [];

        line.push(
            `${this.Lesson(this.Group(lesson.group) + this.getLessonAlias(lesson.lesson)) + (lesson.type ? this.Type(lesson.type) : '')}`
        );

        if (lesson.cabinet != null) {
            line.push(this.Cabinet(lesson.cabinet));
        }

        if (lesson.comment) {
            line.push(this.Comment(lesson.comment));
        }

        return line.join('\n');
    }

    protected formatLessonHeader(header: string, mainLessons: string, withSubgroups: boolean): string {
        const line: string[] = [
            header
        ];

        if (mainLessons) {
            line.push(mainLessons);
            if (withSubgroups) {
                line.push('')
            }
        }

        return line.join('\n');
    }

    protected formatSubgroupLesson(value: string, currentIndex: number, lastIndex: number): string {
        if (currentIndex > 0) {
            value = '\n' + value;
        }

        return value;
    }

    protected GroupHeader(group: string): string {
        return `👩‍🎓 Группа '${group}'`;
    }

    protected TeacherHeader(teacher: string): string {
        return `👩‍🏫 Преподаватель '${teacher}'`;
    }

    protected DayHeader(day: string, weekday: string): string {
        let hint: string | undefined;

        if (isToday(day)) {
            hint = '(сегодня)'
        }

        if (isTomorrow(day)) {
            hint = '(завтра)'
        }

        return `📅 ${this.b(weekday + (hint ? ` ${this.i(hint)}` : ''))}, ${day}`;
    }

    protected LessonHeader(i: number): string {
        return `\n${this.getSmileNumber(i + 1)} Пара:`;
    }

    protected Subgroup(subgroup: string): string {
        return `    🎒 Подгруппа ${subgroup}:`
    }

    protected Lesson(lesson: string): string {
        return `    📚 ${lesson}`;
    }

    protected Type(type: string): string {
        return ` (${type})`;
    }

    protected Group(group: string): string {
        return `${group}-`;
    }

    protected Teacher(teacher: string): string {
        return `    🎓 ${teacher}`;
    }

    protected Cabinet(cabinet: string): string {
        return `    🏫 ${cabinet}`;
    }

    protected Comment(comment: string): string {
        return `// ${comment}`;
    }

    protected NoLessons(): string {
        return `🚫 Нет пар на этот день`;
    }

    private getSmileNumber(index: number): string {
        return [
            '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
        ][index];
    }

    protected NoTimetable(): string {
        return `🚫 Нет расписания для отображения`;
    }
}