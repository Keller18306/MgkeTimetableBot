import { JSDOM } from "jsdom";
import { doCombine, getTodayDate, strDateToNumber } from "../utils";
import StudentParser from "./parser/group";
import { RaspGroupCache } from "./raspCache";

export default async function updateGroups(rasp: RaspGroupCache) {
    const todayDate: number = getTodayDate();

    //console.log('[Parser - Groups] Start parsing')
    const jsdom = await JSDOM.fromURL(encodeURI('https://mgkct.minskedu.gov.by/персоналии/учащимся/расписание-занятий-на-неделю'), {
        userAgent: 'MGKE bot by Keller'
    });

    const parser = new StudentParser(jsdom.window);

    const data = await parser.run();
    if (Object.keys(data).length == 0) return false;

    const siteMinimalDate: number = Math.min(...Object.entries(data).reduce<number[]>((bounds: number[], [, group]): number[] => {
        for (const day of group.days) {
            const date: number = strDateToNumber(day.day);
            if (bounds.includes(date)) continue;

            bounds.push(date);
        }

        return bounds;
    }, []));

    //to do notice into chats, when has changes 
    const dump = Object.assign({}, rasp.timetable);

    //append new data
    for (const groupIndex in data) {
        const newGroup = data[groupIndex];
        const currentGroup = rasp.timetable[groupIndex];

        if (!currentGroup) {
            rasp.timetable[groupIndex] = data[groupIndex];
        } else {
            currentGroup.days = doCombine(newGroup.days, currentGroup.days || []);
        }
    }

    //clear old
    for (const groupIndex in rasp.timetable) {
        const group = rasp.timetable[groupIndex];

        group.days = group.days.filter((day) => {
            const dayDate: number = strDateToNumber(day.day);

            return (dayDate >= todayDate || dayDate >= siteMinimalDate);
        });

        if (group.days.length === 0) {
            delete rasp.timetable[groupIndex];
        }
    }

    rasp.update = Date.now();

    return true;
}