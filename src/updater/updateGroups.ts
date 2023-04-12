import { JSDOM } from "jsdom";
import { getTodayDate, strDateToNumber } from "../utils";
import { doCombine } from "../utils/combineRasp";
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

    //append new data, and clear old
    for (const group in data) {
        if (!rasp.timetable[group]) {
            for (const group in data) {
                rasp.timetable[group] = data[group];
            }
        } else {
            const newDays = doCombine(data[group].days, rasp.timetable[group]?.days || []).filter((day) => {
                const dayDate: number = strDateToNumber(day.day);

                return (dayDate >= todayDate || dayDate >= siteMinimalDate);
            });

            rasp.timetable[group].days = newDays;
        }
    }

    rasp.update = Date.now();

    return true;
}