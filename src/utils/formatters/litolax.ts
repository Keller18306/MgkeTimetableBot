import { GroupLessonExplain, TeacherLessonExplain } from "../../updater/parser/types";
import { GroupLessonOptions, ScheduleFormatter } from "./abstract";

export class LitolaxScheduleFormatter extends ScheduleFormatter {
    public static readonly label: string = '💩 LitolaxStyle';
    
    protected NoTimetable(): string {
        throw new Error("Method not implemented.");
    }
    protected formatLessonHeader(header: string, mainLessons: string, withSubgroups: boolean): string {
        throw new Error("Method not implemented.");
    }
    protected formatSubgroupLesson(value: string, currentIndex: number, lastIndex: number): string {
        throw new Error("Method not implemented.");
    }
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

    protected groupHeader(group: string): string {
        return `Группа: ${this.b(group)}`;
    }

    protected teacherHeader(teacher: string): string {
        return `Преподаватель: ${this.b(teacher)}`;
    }
}