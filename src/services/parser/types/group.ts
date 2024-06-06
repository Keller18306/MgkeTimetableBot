export interface Groups {
    [group: string]: Group
}

export interface Group {
    group: string,
    days: GroupDay[],
    lastNoticedDay?: number
}

export interface GroupDay {
    day: string,
    lessons: GroupLesson[]
}

export type GroupLesson = GroupLessonExplain | GroupLessonExplain[] | null

export interface GroupLessonExplain {
    subgroup?: number,
    lesson: string,
    type: string | null,
    teacher: string | null,
    cabinet: string | null,
    comment: string | null
}
