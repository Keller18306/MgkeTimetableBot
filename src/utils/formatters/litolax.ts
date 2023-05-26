import { GroupLessonExplain, TeacherLessonExplain } from "../../updater/parser/types";
import { GroupLessonOptions, ScheduleFormatter } from "./abstract";

export class LitolaxScheduleFormatter extends ScheduleFormatter {
    protected formatGroupLesson(lesson: GroupLessonExplain, options: GroupLessonOptions): string {
        throw new Error("Method not implemented.");
    }
    protected formatTeacherLesson(lesson: TeacherLessonExplain): string {
        throw new Error("Method not implemented.");
    }
    protected GroupHeader(group: string): string {
        throw new Error("Method not implemented.");
    }
    protected TeacherHeader(group: string): string {
        throw new Error("Method not implemented.");
    }
    protected DayHeader(day: string, weekday: string): string {
        throw new Error("Method not implemented.");
    }
    protected LessonHeader(i: number): string {
        throw new Error("Method not implemented.");
    }
    protected Subgroup(subgroup: string): string {
        throw new Error("Method not implemented.");
    }
    protected Lesson(lesson: string): string {
        throw new Error("Method not implemented.");
    }
    protected Type(type: string): string {
        throw new Error("Method not implemented.");
    }
    protected Group(group: string): string {
        throw new Error("Method not implemented.");
    }
    protected Teacher(teacher: string): string {
        throw new Error("Method not implemented.");
    }
    protected Cabinet(cabinet: string): string {
        throw new Error("Method not implemented.");
    }
    protected Comment(comment: string): string {
        throw new Error("Method not implemented.");
    }
    protected NoLessons(): string {
        throw new Error("Method not implemented.");
    }

    public readonly label: string = '💩 LitolaxStyle';


    protected groupHeader(group: string): string {
        return `Группа: ${this.b(group)}`;
    }

    protected teacherHeader(teacher: string): string {
        return `Учитель: ${this.b(teacher)}`;
    }
}