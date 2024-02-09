export type Teachers = {
    [teacher: string]: Teacher
}

export type Teacher = {
    teacher: string,
    days: TeacherDay[],
    lastNoticedDay?: number
}

export type TeacherDay = {
    day: string,
    lessons: TeacherLesson[]
}

export type TeacherLesson = TeacherLessonExplain | null

export type TeacherLessonExplain = {
    lesson: string,
    type: string | null,
    group: string,
    cabinet: string | null,
    comment: string | null
}
