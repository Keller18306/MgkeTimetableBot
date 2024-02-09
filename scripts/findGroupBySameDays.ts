import db from '../src/db';
import { GroupLesson, GroupLessonExplain } from '../src/services/timetable/types';
import { DayIndex } from '../src/utils';

const days: string[] = [
    '01.09.2023', '04.09.2023', '19.09.2023'
];

const myGroup = 63;
const mySubgroup = 2;

let totalGroups: number[] = [];

for (const day of days) {
    const index: number = DayIndex.fromStringDate(day).valueOf();

    const groups: any[] = db.prepare('SELECT * FROM timetable_archive WHERE day = ? AND teacher IS NULL')
        .all(index)
        .map((entry: any) => {
            entry.data = JSON.parse(entry.data);

            return entry;
        }).filter((entry) => {
            const lessons = entry.data;
            if (!lessons.length) {
                return false;
            }

            let lastLesson = lessons.at(-1);
            lastLesson = Array.isArray(lastLesson) ? lastLesson[0] : lastLesson;

            const cabinet = lastLesson.cabinet;
            if (cabinet && cabinet.startsWith('Кн')) {
                return false;
            }

            return true;
        });

    const myGroupEntry = groups.find((_) => {
        return _.group == myGroup;
    });

    const myCount = getLessonsCount(myGroupEntry)[mySubgroup];
    console.log('У меня сегодня пар (с моей подгруппой)', myCount)

    const findedGroups: number[] = [];

    for (const group of groups) {
        const num = group.group;
        if (num === myGroup) continue;

        const counts = getLessonsCount(group);

        if (Object.keys(counts).length === 1) {
            //без подгрупп на этот день

            if (counts.common === myCount) {
                findedGroups.push(num)

                console.log('Для группы', num, 'совпадает завершения', '(у группы нет сегодня подгрупп)')
            }
        } else {
            delete counts.common;

            const subgroupsWithMyCount: number[] = []
            for (const subgroup in counts) {
                const count = counts[subgroup];

                if (count === myCount) {
                    subgroupsWithMyCount.push(+subgroup);
                }
            }

            if (subgroupsWithMyCount.length) {
                findedGroups.push(num)

                console.log('Для группы', num, 'совпадает завершения', 'со следующими подгруппами', subgroupsWithMyCount)
            }
        }
    }

    console.log('День', day, 'вышли со мной', findedGroups);

    if (totalGroups.length === 0) { 
        totalGroups = findedGroups;
    } else {
        totalGroups = totalGroups.filter(group => {
            return findedGroups.includes(group);
        })

        console.log('Значит остаются: ', totalGroups)
    }
}

function getLessonsCount(group: any) {
    const lessons: GroupLesson[] = group.data.slice();

    const subgroups: number[] = [];
    const onlySubgroupsLessons = lessons.filter((entry) => {
        return Array.isArray(entry);
    }) as GroupLessonExplain[][];

    for (const entry of onlySubgroupsLessons) {
        for (const subgroupEntry of entry) {
            const subgroup = subgroupEntry.subgroup;

            if (!subgroup || subgroups.includes(subgroup)) continue;

            subgroups.push(subgroup);
        }
    }

    const lessonsCount: any = {};
    lessonsCount.common = lessons.length;

    for (const subgroup of subgroups) {
        let count: number = 0;

        let firstFound: boolean = false;

        for (const lesson of lessons) {
            if (Array.isArray(lesson)) {
                const hasSubgroup = lesson.find((lesson) => {
                    return lesson.subgroup == subgroup;
                });

                if (hasSubgroup) {
                    firstFound = true;
                }

                if (firstFound && !hasSubgroup) {
                    break;
                }
            }

            count++;
        }

        lessonsCount[subgroup] = count;
    }

    return lessonsCount;
}