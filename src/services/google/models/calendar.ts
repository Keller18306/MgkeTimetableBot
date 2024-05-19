import { GaxiosError } from "gaxios";
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Transaction } from "sequelize";
import { sequelize } from "../../../db";
import { StringDate } from "../../../utils";
import { GroupDay, TeacherDay } from "../../timetable";
import { GoogleCalendarApi } from "../api";

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

    public static async getOrCreateCalendar(type: 'teacher' | 'group', value: string | number): Promise<CalendarItem> {
        return sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
        }, async (transaction) => {
            let calendar: CalendarItem | null = await CalendarItem.findOne({
                where: { type, value },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (calendar) {
                return calendar;
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

            return CalendarItem.upsert({
                calendarId: calendarId,
                type: type,
                value: String(value)
            }, { transaction }).then(res => res[0]);
        })
    }

    public static async getCalendar(type: 'teacher' | 'group', value: string | number): Promise<CalendarItem | null> {
        return CalendarItem.findOne({
            where: { type, value }
        });
    }

    declare id: CreationOptional<number>;
    declare type: 'group' | 'teacher';
    declare value: string;
    declare calendarId: string;
    declare lastManualSyncedDay: CreationOptional<number>;

    public async clearDay({ day }: GroupDay | TeacherDay) {
        const dayDate = StringDate.fromStringDate(day).toDate();

        try {
            await CalendarItem.api.clearDayEvents(this.calendarId, dayDate);
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
        defaultValue: 0
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
