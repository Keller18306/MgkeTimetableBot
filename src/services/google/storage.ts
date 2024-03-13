import db from "../../db";

export class CalendarStorage {
    public getCalendarId(type: 'teacher' | 'group', value: string | number): string | undefined {
        const calendar: any = db.prepare("SELECT calendarId FROM google_calendars WHERE `type` = ? AND `value` = ?").get(type, value);

        return calendar?.calendarId ?? undefined;
    }

    public saveCalendarId(type: 'teacher' | 'group', value: string | number, calendarId: string): void {
        db.prepare('INSERT INTO google_calendars (`type`, `value`, `calendarId`) VALUES (:type, :value, :calendarId) ON CONFLICT(`type`, `value`) DO UPDATE SET calendarId = :calendarId, lastManualSyncedDay = 0')
            .run({ type, value, calendarId });
    }

    public deleteCalendarId(calendarId: string): void {
        db.prepare('DELETE FROM google_calendars WHERE calendarId = :calendarId')
            .run({ calendarId });
    }


    public getLastManualSyncedDay(type: 'teacher' | 'group', value: string | number): number | undefined {
        const calendar: any = db.prepare("SELECT lastManualSyncedDay FROM google_calendars WHERE `type` = ? AND `value` = ?")
            .get(type, value);

        return calendar?.lastManualSyncedDay ?? undefined;
    }

    public setLastManualSyncedDay(type: 'teacher' | 'group', value: string | number, dayIndex: number): void {
        db.prepare("UPDATE google_calendars SET lastManualSyncedDay = ? WHERE `type` = ? AND `value` = ?").run(dayIndex, type, value);
    }

    public getAllCalendarIds(): string[] {
        const calendars: any[] = db.prepare("SELECT calendarId FROM google_calendars").all();

        return calendars.map((entry) => {
            return entry.calendarId;
        });
    }
}