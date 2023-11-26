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

if (config.vk.bot.enabled) {
    VkBot.instance.run()
}

if (config.http.enabled) {
    HttpServer.instance.run()
    new ImageService(HttpServer.instance.app)
}

if (config.vk.app.enabled) {
    new VKApp(HttpServer.instance.app)
}

if (config.telegram.enabled) {
    TgBot.instance.run()
}

if (config.viber.enabled) { 
    ViberBot.create(HttpServer.instance.app).run()
}

if (config.api.enabled) {
    new Api(HttpServer.instance.app)
}

if (config.alice.enabled) {
    new AliceApp(HttpServer.instance.app)
}

if (config.updater.enabled) {
    Updater.getInstance().start()
}

startVanishCronJob();