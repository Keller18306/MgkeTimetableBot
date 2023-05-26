import { chunkArray } from "../../utils";
import { AbstractParser } from "./abstract";
import { GroupDay, GroupLesson, GroupLessonExplain, Groups } from './types/group';

export default class StudentParser extends AbstractParser {
    protected groups: Groups = {}

    public run(groups?: Groups) {
        if (groups) {
            this.groups = groups;
        }

        for (const table of this.parseBodyTables()) {
            let h2: HTMLHeadingElement | null = null;
            let element: Element | null = table.previousElementSibling;
            while (h2 === null && element !== null) {
                if (element?.tagName.toLowerCase() === 'h2') {
                    h2 = element as HTMLHeadingElement;
                    break;
                }

                if (element?.tagName.toLowerCase() === 'table') {
                    break;
                }

                element = element?.previousElementSibling || null;
            }

            if (!h2) {
                continue;
            }

            this.parseGroup(table, h2)
        }
        
        this.clearSundays(this.groups);

        for (const group in this.groups) {
            for (const day of this.groups[group].days) {
                this.processDay(day)
            }
        }   

        return this.groups
    }

    protected parseGroup(table: HTMLTableElement, h2: HTMLHeadingElement) {
        const group = h2.textContent?.split('-', 2)[1]?.trim();
        const groupNumber = this.parseGroupNumber(group);
        if (!group || !groupNumber) throw new Error('Невозможно получить номер группы')

        const rows = Array.from(table.rows)

        const days: GroupDay[] = this.getDays(rows[0]);
        this.parseLessons(rows, days);
        // for (const { lessons } of days) {
        //     this.clearEndingNull(lessons);
        // }

        this.groups[groupNumber] = {
            group: group,
            days: days
        }
    }

    protected getDays(row: HTMLTableRowElement): GroupDay[] {
        const days: GroupDay[] = []

        const dayNames = this.parseDayNames(row)
        for (const dayName of dayNames) {
            const { day, weekday } = this.parseDayName(dayName)

            days.push({
                day: day,
                weekday: weekday,
                lessons: []
            })
        }

        return days
    }

    protected parseDayNames(row: HTMLTableRowElement): string[] {
        const cells = Array.from(row.cells)

        const days: string[] = []

        for (const cell_i in cells) {
            if (+cell_i == 0) continue;
            const cell = cells[cell_i]

            const day = cell.textContent?.replaceAll('\n', '')
            if (day == undefined) throw new Error('Невозможно получить название дня недели');

            days.push(day)
        }

        return days;
    }

    protected parseLessons(rows: HTMLTableRowElement[], days: GroupDay[]) {
        for (const row_i in rows) {
            if (+row_i <= 1) continue;
            const row = rows[row_i]
            const cells = row.cells

            for (let cell_i: number = 1; cell_i < Math.ceil(cells.length / 2); cell_i++) {
                const day = cell_i - 1;

                const lessonCell = cells[cell_i * 2 - 1];
                const cabinetCell = cells[cell_i * 2];

                const lesson = this.parseLesson(lessonCell, cabinetCell);
                days[day].lessons.push(lesson)
            }
        }
    }

    protected parseLesson(lessonCell: HTMLTableCellElement, cabinetCell: HTMLTableCellElement): GroupLesson {
        let lesson: string | undefined | null = lessonCell.textContent?.trim();
        let cabinet: string | undefined | null = cabinetCell.textContent?.trim();

        if (lesson == undefined || cabinet == undefined) {
            throw new Error('Урок или кабинет не определён')
        }

        lesson = this.setNullIfEmpty(lesson)
        cabinet = this.setNullIfEmpty(this.removeDashes(cabinet))
        let subgroups: GroupLessonExplain[] | null = null;

        if (!lesson) {
            return null;
        } else {
            const lessonsChunk = chunkArray(
                Array
                    .from(lessonCell.childNodes)
                    .filter(_ => _.nodeType === _.TEXT_NODE)
                    .map(_ => _.textContent!),
                3);
            const cabinetChunk = Array
                .from(cabinetCell.childNodes)
                .filter(_ => _.nodeType === _.TEXT_NODE)
                .map(_ => _.textContent!);

            subgroups = this.parseSubGroupLesson(lessonsChunk, cabinetChunk);

            if (subgroups) {
                return subgroups;
            }
        }

        const group = Array
            .from(lessonCell.childNodes)
            .filter(_ => _.nodeType === _.TEXT_NODE)
            .map(_ => _.textContent!);
        const matchType = group[1]?.match(/\((.+)\)/)?.slice(1)[0]
        // if (!matchType) {
        //     throw new Error('Тип урока не был получен')
        // }

        return {
            lesson: group[0],
            type: matchType || null,
            teacher: group[2] || null,
            cabinet: cabinet,
            comment: null
        }
    }

    protected parseSubGroupLesson(subGroups: string[][], cabinets: string[]): GroupLessonExplain[] | null {
        let isSubGroups: boolean = false;

        for (const subgroup of subGroups) {
            if (/^\d+\./.test(subgroup[0])) {
                isSubGroups = true;
                break;
            }
        }

        if (!isSubGroups) {
            return null;
        }

        if (cabinets.length !== 1 && subGroups.length > cabinets.length) {
            throw new Error('Подгруппы и кабинеты не совпадают');
        }

        const parsed: GroupLessonExplain[] = [];
        for (const i in subGroups) {
            const subGroup = subGroups[i];

            const matchName = subGroup[0].match(/(\d+)\.\s?(.+)/)?.slice(1)
            const matchType = subGroup[1].match(/\((.+)\)/)?.slice(1)[0]
            if (!matchName || !matchType) {
                throw new Error('Название урока или тип урока не были получены для подгруппы')
            }

            const sgNumber: number = Number(matchName[0]);

            let cabinet: string | null;
            if (cabinets.length === 1) {
                cabinet = cabinets[0];
            } else {
                if (subGroups.length < cabinets.length) {
                    if (sgNumber > cabinets.length) {
                        throw new Error('Кабинет не существует для подгруппы')
                    }

                    cabinet = cabinets[sgNumber - 1];
                } else {
                    cabinet = cabinets[i];
                }
            }

            cabinet = this.setNullIfEmpty(this.removeDashes(cabinet));

            parsed.push({
                subgroup: sgNumber,
                lesson: matchName[1],
                type: matchType,
                teacher: subGroup[2],
                cabinet: cabinet,
                comment: null
            })
        }

        return parsed
    }

    private processDay(day: GroupDay) {
        for (let i: number = 0; i <= day.lessons.length; i++) {
            let lesson: GroupLesson = day.lessons[i];
            if (!lesson) continue;

            if (!Array.isArray(lesson)) {
                lesson = [lesson]
            }

            // фикс факультативов, то есть из двух факультативов делается один с пометкой "2 часа"
            if (lesson.every(_ => _.type === 'ф-в' && _.comment == null)) {
                let simmilarIndex: number | null = null;

                let firstNotNull = false;
                for (let j: number = day.lessons.length; j > i; j--) {
                    let fLesson: GroupLesson = day.lessons[j];

                    if (firstNotNull && !fLesson) break;
                    if (!fLesson) continue;
                    firstNotNull = true;

                    if (!Array.isArray(fLesson)) {
                        fLesson = [fLesson]
                    }

                    if (lesson.length !== fLesson.length) continue;

                    for (let i = 0; i < lesson.length; i++) {
                        if (
                            lesson[i].type === fLesson[i].type &&
                            lesson[i].lesson === fLesson[i].lesson &&
                            lesson[i].teacher === fLesson[i].teacher
                        ) {
                            simmilarIndex = j;
                            break;
                        }
                    }

                    if (simmilarIndex !== null) {
                        break;
                    }
                }

                if (simmilarIndex !== null) {
                    lesson.forEach(_ => _.comment = '2 часа')
                    day.lessons[simmilarIndex] = null;
                }
            }
        }

        this.clearEndingNull(day.lessons)
    }
}