import { App } from "../../app";

const app = new App(['timetable', 'google', 'parser']);
const calendar = app.getService('google').calendar;

const main = async () => {
    console.log('Parse latest');
    await app.getService('parser').parse();

    console.log('Sync calendar');
    // await calendar.resyncGroup('63')
    await calendar.resync();
}

main();