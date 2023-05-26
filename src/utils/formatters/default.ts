import { GroupLessonExplain, TeacherLessonExplain } from "../../updater/parser/types";
import { GroupLessonOptions, ScheduleFormatter } from "./abstract";

export class DefaultScheduleFormatter extends ScheduleFormatter {
    public readonly label: string = '📝 Стуктурированный';

    protected formatGroupLesson(lesson: GroupLessonExplain, options: GroupLessonOptions): string {
        const line: string[] = [];

        if (options.showSubgroup && lesson.subgroup != null) {
            line.push(this.Subgroup(`${lesson.subgroup}`));
        }

        if (options.showLesson) {
            line.push(this.Lesson(lesson.lesson));
        }

        if (options.showType) {
            line.push(this.Type(lesson.type));
        }

        if (options.showTeacher) {
            line.push(this.Teacher(lesson.teacher));
        }

        if (options.showCabinet && lesson.cabinet != null) {
            line.push(this.Cabinet(lesson.cabinet));
        }

        if (options.showComment && lesson.comment != null) {
            line.push(this.Comment(lesson.comment));
        }

        return line.join(' ');
    }

    protected formatTeacherLesson(lesson: TeacherLessonExplain): string {
        const line: string[] = [];

        line.push(
            `${this.Group(lesson.group)}${this.Lesson(lesson.lesson)}`
        );

        line.push(this.Type(lesson.type));

        if (lesson.cabinet != null) {
            line.push(this.Cabinet(lesson.cabinet));
        }

        if (lesson.comment) {
            line.push(this.Comment(lesson.comment));
        }

        return line.join(' ');
    }

    protected GroupHeader(group: string): string {
        return `- Группа '${group}' -`;
    }

    protected TeacherHeader(teacher: string): string {
        return `- Учитель '${teacher}' -`;
    }

    protected DayHeader(day: string, weekday: string): string {
        return `__ ${weekday}, ${day} __`;
    }

    protected LessonHeader(i: number): string {
        return `${+i + 1}. `;
    }

    protected Subgroup(subgroup: string): string {
        return `${subgroup}.`;
    }

    protected Lesson(lesson: string): string {
        return lesson;
    }

    protected Type(type: string): string {
        return `(${type})`;
    }

    protected Group(group: string): string {
        return `${group}-`;
    }

    protected Teacher(teacher: string): string {
        return teacher;
    }

    protected Cabinet(cabinet: string): string {
        return `{${cabinet}}`;
    }

    protected Comment(comment: string): string {
        return `// ${comment}`;
    }

    protected NoLessons(): string {
        return 'Пар нет';
    }

}