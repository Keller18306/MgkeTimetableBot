import { GaxiosError } from "gaxios";
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Transaction } from "sequelize";
import { sequelize } from "../../../db";
import { StringDate } from "../../../utils";
import { GroupDay, TeacherDay } from "../../timetable";
import { GoogleCalendarApi, OnDeleteGoogleEvent } from "../api";

export type CalendarType = 'group' | 'teacher';

export interface CalendarLessonInfo {
    title: string;
    description: string;
    location: string | undefined;
}

class CalendarItem extends Model<InferAttributes<CalendarItem>, InferCreationAttributes<CalendarItem>> {
    private static _api: GoogleCalendarApi | undefined;

    public static set api(api: GoogleCalendarApi) {
        this._api = api;
    }

    public static get api(): GoogleCalendarApi {
        if (!this._api) {
            throw new Error('api not provided');
        }

        return this._api;
    }

    public static async getOrCreateCalendar(type: CalendarType, value: string | number): Promise<[CalendarItem, boolean]> {
        return sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
        }, async (transaction) => {
            let calendar: CalendarItem | null = await CalendarItem.findOne({
                where: { type, value },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (calendar) {
                return [calendar, false];
            }

            let owner: string | undefined;
            if (type === 'group') {
                owner = 'Группа';
            } else if (type === 'teacher') {
                owner = 'Преподаватель';
            }

            console.log('Creating calendar:', type, value);
            const calendarId = await this.api.createCalendar(`Расписание занятий (${owner} - ${value})`);
            console.log('Created', type, value, calendarId);

            calendar = await CalendarItem.upsert({
                calendarId: calendarId,
                type: type,
                value: String(value)
            }, { transaction }).then(res => res[0]);

            return [calendar!, true];
        })
    }

    public static async getCalendar(type: CalendarType, value: string | number): Promise<CalendarItem | null> {
        return CalendarItem.findOne({
            where: { type, value }
        });
    }

    declare id: CreationOptional<number>;
    declare type: 'group' | 'teacher';
    declare value: string;
    declare calendarId: string;
    declare lastManualSyncedDay: CreationOptional<number | null>;

    public async clearDay({ day }: GroupDay | TeacherDay, onDelete?: OnDeleteGoogleEvent) {
        const dayDate = StringDate.fromStringDate(day).toDate();

        try {
            await CalendarItem.api.clearDayEvents(this.calendarId, dayDate, onDelete);
        } catch (e) {
            if (e instanceof GaxiosError) {
                if (e.status === 410) {
                    await this.destroy();
                }
            }

            throw e;
        }
    }

    public async createEvent({ title, description, location }: CalendarLessonInfo, { day }: GroupDay | TeacherDay, bound: [string, string]) {
        const from = StringDate.fromStringDateTime(day, bound[0]).toDate();
        const to = StringDate.fromStringDateTime(day, bound[1]).toDate();

        return CalendarItem.api.createEvent({
            calendarId: this.calendarId,
            title: title,
            start: from,
            end: to,
            description: description,
            location: location
        });
    }
}

CalendarItem.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('group', 'teacher'),
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    calendarId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    lastManualSyncedDay: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'google_calendars',
    indexes: [
        {
            fields: ['type', 'value'],
            unique: true
        }
    ]
});

export { CalendarItem };
