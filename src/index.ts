import { config } from "../config";
import { startVanishCronJob } from "./db";
import { HttpServer } from "./http";
import { AliceApp } from "./services/alice";
import { Api } from "./services/api";
import { CommandController } from "./services/bots/controller";
import { TgBot } from "./services/bots/tg";
import { ViberBot } from './services/bots/viber';
import { VkBot } from './services/bots/vk';
import { ImageService } from "./services/image";
import { VKApp } from './services/vk_app';
import { Updater } from './updater';

if (config.vk.bot.enabled || config.viber.enabled || config.telegram.enabled) {
    CommandController.instance
}

const http = new HttpServer();

if (config.vk.bot.enabled) {
    new VkBot().run();
}

if (config.http.enabled) {
    http.run()

    http.register(ImageService);
}

if (config.vk.app.enabled) {
    http.register(VKApp);
}

if (config.telegram.enabled) {
    new TgBot().run();
}

if (config.viber.enabled) { 
    http.register(ViberBot).run();
}

if (config.api.enabled) {
    http.register(Api);
}

if (config.alice.enabled) {
    http.register(AliceApp);
}

if (config.updater.enabled) {
    Updater.getInstance().start()
}

startVanishCronJob();