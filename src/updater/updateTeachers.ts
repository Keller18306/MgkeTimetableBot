import { JSDOM } from "jsdom";
import { doCombine, getTodayDate, strDateToNumber } from "../utils";
import TeacherParser from "./parser/teacher";
import { RaspTeacherCache } from "./raspCache";

export default async function updateTeachers(rasp: RaspTeacherCache) {
    const todayDate: number = getTodayDate();

    const jsdom = await JSDOM.fromURL(encodeURI('https://mgkct.minskedu.gov.by/персоналии/преподавателям/расписание-занятий-на-неделю'), {
        userAgent: 'MGKE bot by Keller'
    })

    const parser = new TeacherParser(jsdom.window);

    const data = await parser.run();
    if (Object.keys(data).length == 0) return false;

    const siteMinimalDate: number = Math.min(...Object.entries(data).reduce<number[]>((bounds: number[], [, teacher]): number[] => {
        for (const day of teacher.days) {
            const date: number = strDateToNumber(day.day);
            if (bounds.includes(date)) continue;

            bounds.push(date);
        }

        return bounds;
    }, []));

    //to do notice into chats, when has changes 
    const dump = Object.assign({}, rasp.timetable);

    //append new data
    for (const teacherIndex in data) {
        const newTeacher = data[teacherIndex];
        const currentTeacher = rasp.timetable[teacherIndex];

        if (!currentTeacher) {
            rasp.timetable[teacherIndex] = data[teacherIndex];
        } else {
            currentTeacher.days = doCombine(newTeacher.days, currentTeacher.days || []);
        }
    }

    //clear old
    for (const teacherIndex in rasp.timetable) {
        const teacher = rasp.timetable[teacherIndex];

        teacher.days = teacher.days.filter((day) => {
            const dayDate: number = strDateToNumber(day.day);

            return (dayDate >= todayDate || dayDate >= siteMinimalDate);
        });

        if (teacher.days.length === 0) {
            delete rasp.timetable[teacherIndex];
        }
    }

    rasp.update = Date.now();

    return true;
}