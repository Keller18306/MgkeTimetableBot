import { App } from "../../app";
import { CalendarItem } from "./models/calendar";

const app = new App(['timetable', 'google', 'parser']);

const api = app.getService('google').api.calendar.api;
const { calendarController: controller } = app.getService('google');

const main = async () => {
    const ids: string[] = [];
    const calendars = await api.calendarList.list({ maxResults: 250 }).then(({ data }) => {
        return data.items?.map(({ id, summary }, i) => {
            ids.push(id as string);
            return `${i + 1}. ${summary} - ${id}`
        })
    });

    console.log(calendars?.length, calendars?.join('\n'))

    const dbCalendars = await CalendarItem.findAll({
        attributes: ['calendarId']
    }).then((calendars) => {
        return calendars.map(calendar => calendar.calendarId);
    });
    // const toRemove = ids.filter((id) => !dbCalendars.includes(id));
    // if (toRemove.length > 0) {
    //     console.log('Removing calendars from Google:', toRemove);

    //     for (const id of toRemove) {
    //         await api.calendars.delete({ calendarId: id });
    //     }
    // }

    console.log('Parse latest');
    await app.getService('parser').parse();

    console.log('Sync calendar');
    // await calendar.resync(true);

    const [calendar] = await CalendarItem.getOrCreateCalendar('group', '63');

    await controller.resync(calendar, { forceFullResync: true, firstlyRelevant: true });
}

main();