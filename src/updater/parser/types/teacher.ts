export type Teachers = {
    [teacher: string]: Teacher
}

export type Teacher = {
    teacher: string,
    days: TeacherDay[]
}

export type TeacherDay = {
    day: string,
    weekday: string,
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
