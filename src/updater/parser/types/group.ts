export type Groups = {
    [group: string]: Group
}

export type Group = {
    group: string,
    days: GroupDay[]
}

export type GroupDay = {
    day: string,
    weekday: string,
    lessons: GroupLesson[]
}

export type GroupLesson = GroupLessonExplain | GroupLessonExplain[] | null

export type GroupLessonExplain = {
    subgroup?: number
    lesson: string,
    type: string,
    teacher: string,
    cabinet: string | null,
    comment: string | null
}
