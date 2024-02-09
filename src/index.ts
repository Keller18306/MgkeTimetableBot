import { App } from "./app";
import { startVanishCronJob as setupVanishCron } from "./db";
import { HttpService } from "./http";
import { AliceApp } from "./services/alice";
import { Api } from "./services/api";
import { BotService } from "./services/bots";
import { TgBot } from "./services/bots/tg";
import { ViberBot } from './services/bots/viber';
import { VkBot } from './services/bots/vk';
import { GoogleService } from "./services/google";
import { ImageService } from "./services/image";
import { ParserService } from './services/parser';
import { Timetable } from "./services/timetable";
import { VKApp } from './services/vk_app';

const app = new App();

app.registerService('timetable', Timetable);
app.registerService('parser', ParserService);
app.registerService('bot', BotService);
app.registerService('vk', VkBot);
app.registerService('http', HttpService);
app.registerService('image', ImageService);
app.registerService('vkApp', VKApp);
app.registerService('tg', TgBot);
app.registerService('viber', ViberBot);
app.registerService('api', Api);
app.registerService('alice', AliceApp);
app.registerService('google', GoogleService);

app.runServices().then(() => {
    console.log('[CORE]', 'Loaded services:', app.getServiceList().join(', '))
});

setupVanishCron(app);