export interface Teachers {
    [teacher: string]: Teacher
}

export interface Teacher {
    teacher: string,
    days: TeacherDay[],
    lastNoticedDay?: number
}

export interface TeacherDay {
    day: string,
    lessons: TeacherLesson[]
}

export type TeacherLesson = TeacherLessonExplain | null

export interface TeacherLessonExplain {
    lesson: string,
    type: string | null,
    subgroup?: number,
    group: string,
    cabinet: string | null,
    comment: string | null
}
