import { Op } from "sequelize";
import { AppService } from "../../app";
import { sequelize } from "../../db";
import { DayIndex, StringDate, WeekIndex } from "../../utils";
import { loadCache } from "../parser/raspCache";
import { GroupDay, TeacherDay } from "../parser/types";
import { TimetableArchive } from "./models/timetable";

export type ArchiveAppendDay = {
    type: 'group',
    group: string,
    day: GroupDay
} | {
    type: 'teacher',
    teacher: string,
    day: TeacherDay
}

function dbEntryToDayObject(entry: TimetableArchive): any {
    return {
        day: StringDate.fromDayIndex(entry.day).toString(),
        lessons: JSON.parse(entry.data)
    };
}

export class Timetable implements AppService {
    constructor() { }

    public run() {
        loadCache();
    }

    public async getDayIndexBounds(): Promise<{ min: number, max: number }> {
        const { fn, col } = sequelize;

        const data = await TimetableArchive.findOne({
            attributes: [
                [fn('min', col('day')), 'min'],
                [fn('max', col('day')), 'max'],
            ],
            rejectOnEmpty: true
        });

        return {
            min: data.get('min') as number,
            max: data.get('max') as number
        };
    }

    public async getWeekIndexBounds(): Promise<{ min: number, max: number }> {
        const { min, max } = await this.getDayIndexBounds();

        return {
            min: WeekIndex.fromDayIndex(min).valueOf(),
            max: WeekIndex.fromDayIndex(max).valueOf()
        }
    }

    public async getGroups(): Promise<string[]> {
        const data = await TimetableArchive.findAll({
            attributes: ['group'],
            where: {
                group: {
                    [Op.not]: null
                }
            },
            group: 'group'
        });

        return data.map((entry) => {
            return entry.group!;
        });
    }

    public async getTeachers(): Promise<string[]> {
        const data = await TimetableArchive.findAll({
            attributes: ['teacher'],
            where: {
                teacher: {
                    [Op.not]: null
                }
            },
            group: 'teacher'
        });

        return data.map((entry) => {
            return entry.teacher!;
        });
    }

    public async getGroupDay(dayIndex: number, group: string): Promise<GroupDay | null> {
        const entry = await TimetableArchive.findOne({
            attributes: ['day', 'data'],
            where: {
                day: dayIndex,
                group: group
            }
        });

        return entry ? dbEntryToDayObject(entry) : null;
    }

    public async getTeacherDay(dayIndex: number, teacher: string): Promise<TeacherDay | null> {
        const entry = await TimetableArchive.findOne({
            attributes: ['day', 'data'],
            where: {
                day: dayIndex,
                teacher: teacher
            }
        });

        return entry ? dbEntryToDayObject(entry) : null;
    }

    public async getGroupDaysByRange(dayBounds: [number, number], group: string): Promise<GroupDay[]> {
        const days = await TimetableArchive.findAll({
            attributes: ['day', 'data'],
            where: {
                group: group,
                day: {
                    [Op.between]: dayBounds
                }
            }
        });

        return days.map(dbEntryToDayObject);
    }

    public async getTeacherDaysByRange(dayBounds: [number, number], teacher: string): Promise<TeacherDay[]> {
        const days = await TimetableArchive.findAll({
            attributes: ['day', 'data'],
            where: {
                teacher: teacher,
                day: {
                    [Op.between]: dayBounds
                }
            }
        });

        return days.map(dbEntryToDayObject);
    }

    public async getGroupDays(group: string, fromDay?: number): Promise<GroupDay[]> {
        const days = await TimetableArchive.findAll({
            attributes: ['day', 'data'],
            where: {
                group: group,
                ...(fromDay !== undefined ? {
                    day: {
                        [Op.gte]: fromDay
                    }
                } : {})
            }
        });

        return days.map(dbEntryToDayObject);
    }

    public async getTeacherDays(teacher: string, fromDay?: number): Promise<TeacherDay[]> {
        const days = await TimetableArchive.findAll({
            attributes: ['day', 'data'],
            where: {
                teacher: teacher,
                ...(fromDay !== undefined ? {
                    day: {
                        [Op.gte]: fromDay
                    }
                } : {})
            }
        });

        return days.map(dbEntryToDayObject);
    }

    public async appendDays(entries: ArchiveAppendDay[]) {
        if (entries.length === 0) {
            return;
        }

        await sequelize.transaction(async (transaction) => {
            await TimetableArchive.bulkCreate(entries.filter((entry) => {
                return entry.type === 'group';
            }).map((entry) => {
                const { day } = entry;

                const dayIndex: number = DayIndex.fromStringDate(day.day).valueOf();
                const data: string = JSON.stringify(day.lessons);

                return {
                    day: dayIndex,
                    group: (entry as any).group,
                    data: data
                }
            }), {
                returning: false,
                updateOnDuplicate: ['data'],
                conflictAttributes: ['day', 'group']
            });

            await TimetableArchive.bulkCreate(entries.filter((entry) => {
                return entry.type === 'teacher';
            }).map((entry) => {
                const { day } = entry;

                const dayIndex: number = DayIndex.fromStringDate(day.day).valueOf();
                const data: string = JSON.stringify(day.lessons);

                return {
                    day: dayIndex,
                    teacher: (entry as any).teacher,
                    data: data
                }
            }), {
                returning: false,
                updateOnDuplicate: ['data'],
                conflictAttributes: ['day', 'teacher']
            });

            // for (const entry of entries) {
            //     const { day } = entry;

            //     const dayIndex: number = DayIndex.fromStringDate(day.day).valueOf();
            //     const data: string = JSON.stringify(day.lessons);

            //     switch (entry.type) {
            //         case 'group':
            //             await TimetableArchive.upsert({
            //                 day: dayIndex,
            //                 group: entry.group,
            //                 data: data
            //             }, { transaction });

            //             break;

            //         case 'teacher':
            //             await TimetableArchive.upsert({
            //                 day: dayIndex,
            //                 teacher: entry.teacher,
            //                 data: data
            //             }, { transaction });

            //             break;
            //     }
            // }
        });
    }
}

export * from '../parser/types';

