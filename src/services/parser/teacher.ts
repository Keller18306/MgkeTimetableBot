import { getShortSubjectName } from '../../utils';
import { AbstractParser } from './abstract';
import { Teacher, TeacherDay, TeacherLesson, Teachers } from './types/teacher';

export default class TeacherParser extends AbstractParser {
    protected teachers: Teachers = {}

    public run(): Teachers {
        for (const table of this.parseBodyTables()) {
            const h3 = table.previousElementSibling! as HTMLHeadingElement //date
            const h2 = h3.previousElementSibling! as HTMLHeadingElement //teacher

            this.parseTeacher(table, h2)
        }

        this.clearSundays(this.teachers);

        for (const teacher in this.teachers) {
            for (const day of this.teachers[teacher].days) {
                this.postProcessDay(day);
            }
        }

        return this.teachers;
    }

    protected parseTeacher(table: HTMLTableElement, h2: HTMLHeadingElement) {
        const label = h2.textContent?.trim();
        if (!label) return;

        if (!label.toLowerCase().startsWith('преподаватель')) {
            throw new Error('Это расписание не для преподавателя')
        }

        const teacherName = label.split('-')[1].trim()
        if (teacherName == undefined) {
            throw new Error('Невозможно получить имя преподавателя')
        }

        const rows = Array.from(table.rows)

        const days: TeacherDay[] = this.getDays(rows[0]);
        this.parseLessons(rows, days);

        const teacherWeek: Teacher = {
            teacher: teacherName,
            days: days
        }

        this.teachers[teacherName] = teacherWeek
    }

    protected getDays(row: HTMLTableRowElement): TeacherDay[] {
        const days: TeacherDay[] = []

        const dayNames = this.parseDayNames(row)
        for (const dayName of dayNames) {
            const { day, weekday } = this.parseDayName(dayName)

            days.push({
                day: day,
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

    protected parseLessons(rows: HTMLTableRowElement[], days: TeacherDay[]) {
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

    protected parseLesson(lessonCell: HTMLTableCellElement, cabinetCell: HTMLTableCellElement): TeacherLesson {
        let lessonData: string | undefined | null = lessonCell.textContent?.trim();
        let cabinet: string | undefined | null = cabinetCell.textContent?.trim();

        if (lessonData == undefined || cabinet == undefined) {
            throw new Error('Урок или кабинет не определены')
        }

        lessonData = this.setNullIfEmpty(lessonData === '-' ? '' : lessonData)
        cabinet = this.setNullIfEmpty(this.removeDashes(cabinet))

        if (!lessonData) {
            return null;
        }

        const data = Array
            .from(lessonCell.childNodes)
            .filter(_ => _.nodeType === _.TEXT_NODE)
            .map(_ => _.textContent!);
        const type = data[1]?.match(/\((.+)\)/)?.slice(1)[0];
        const group = data[0].split('-', 2)[0];
        const lesson = data[0].split('-', 2)[1];

        return {
            lesson: getShortSubjectName(lesson),
            type: type || null,
            group: group,
            cabinet: cabinet,
            comment: null
        }
    }

    private postProcessDay(day: TeacherDay) {
        for (let i: number = 0; i <= day.lessons.length; i++) {
            const lesson: TeacherLesson = day.lessons[i];
            if (!lesson || Array.isArray(lesson)) continue;

            // фикс факультативов, то есть из двух факультативов делается один с пометкой "2 часа"
            if (lesson.type === 'ф-в' && lesson.comment == null) {
                let simmilarIndex: number | null = null;

                for (let j: number = day.lessons.length; j > i; j--) {
                    const fLesson: TeacherLesson = day.lessons[j];
                    if (!fLesson || Array.isArray(fLesson)) continue;

                    if (
                        lesson.type === fLesson.type &&
                        lesson.lesson === fLesson.lesson &&
                        lesson.group === fLesson.group
                    ) {
                        simmilarIndex = j;
                        break;
                    }
                }

                if (simmilarIndex !== null) {
                    lesson.comment = '2 часа';
                    day.lessons[simmilarIndex] = null;
                }
            }
        }

        this.clearEndingNull(day.lessons)
    }
}
