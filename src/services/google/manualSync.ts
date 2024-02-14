import { App } from "../../app";

const app = new App(['timetable', 'google', 'parser']);
const calendar = app.getService('google').calendar;

const main = async () => {
    const calendars = await calendar.api.api.calendarList.list({ maxResults: 250 }).then(({ data }) => {
        return data.items?.map(({ id, summary }, i) => {
            return `${i+1}. ${summary} - ${id}`
        })
    });

    console.log(calendars?.length, calendars?.join('\n'))

    console.log('Parse latest');
    await app.getService('parser').parse();

    console.log('Sync calendar');
    // await calendar.resyncTeacher()
    // await calendar.resyncGroup()
    await calendar.resync();
}

main();