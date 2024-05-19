export type Groups = {
    [group: string]: Group
}

export type Group = {
    group: string,
    days: GroupDay[],
    lastNoticedDay?: number
}

export type GroupDay = {
    day: string,
    lessons: GroupLesson[]
}

export type GroupLesson = GroupLessonExplain | GroupLessonExplain[] | null

export type GroupLessonExplain = {
    subgroup?: number,
    lesson: string,
    type: string | null,
    teacher: string | null,
    cabinet: string | null,
    comment: string | null
}
