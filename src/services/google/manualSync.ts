import { App } from "../../app";

const app = new App(['timetable', 'google', 'parser']);
const calendar = app.getService('google').calendar;

const main = async () => {
    const ids: string[] = [];
    const calendars = await calendar.api.api.calendarList.list({ maxResults: 250 }).then(({ data }) => {
        return data.items?.map(({ id, summary }, i) => {
            ids.push(id as string);
            return `${i+1}. ${summary} - ${id}`
        })
    });

    console.log(calendars?.length, calendars?.join('\n'))
    
    const dbCalendars = calendar.storage.getAllCalendarIds();
    const toRemove = ids.filter((id) => !dbCalendars.includes(id));
    if (toRemove.length > 0) {
        console.log('Removing calendars from Google:', toRemove);
        
        for (const id of toRemove) {
            await calendar.api.api.calendars.delete({ calendarId: id });
        }
    }

    console.log('Parse latest');
    await app.getService('parser').parse();

    console.log('Sync calendar');
    // await calendar.resync(true);
    // await calendar.resyncTeacher()
    await calendar.resyncGroup('63', true);
}

main();