import { GroupLessonExplain, TeacherLessonExplain } from "../../updater/parser/types";
import { GroupLessonOptions, ScheduleFormatter } from "./abstract";

export class VisualScheduleFormatter extends ScheduleFormatter {
    public readonly label: string = '🌈 Визуальный';

    protected formatGroupLesson(lesson: GroupLessonExplain, options: GroupLessonOptions): string {
        const line: string[] = [];

        if (options.showSubgroup && lesson.subgroup != null) {
            line.push(this.Subgroup(`${lesson.subgroup}`));
        }

        if (options.showLesson) {
            line.push(this.Lesson(lesson.lesson) + ((options.showType && lesson.type) ? this.Type(lesson.type) : ''));
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
            `${this.Lesson(this.Group(lesson.group) + lesson.lesson) + (lesson.type ? this.Type(lesson.type) : '')}`
        );

        if (lesson.cabinet != null) {
            line.push(this.Cabinet(lesson.cabinet));
        }

        if (lesson.comment) {
            line.push(this.Comment(lesson.comment));
        }

        return line.join('\n');
    }

    protected GroupHeader(group: string): string {
        return `👩‍🎓 Группа '${group}'`;
    }

    protected TeacherHeader(teacher: string): string {
        return `👩‍🏫 Преподаватель '${teacher}'`;
    }

    protected DayHeader(day: string, weekday: string): string {
        return `📅 ${weekday}, ${day}`;
    }

    protected LessonHeader(i: number): string {
        return `\n${this.getSmileNumber(i)} Пара:`;
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
}