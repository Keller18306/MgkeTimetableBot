import { sequelize } from "./db";
import { HttpService } from "./http";
import { Logger } from "./logger";
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

export interface AppService {
    run(): Promise<any> | any;
}

const services = {
    http: HttpService,
    timetable: Timetable,
    bot: BotService,
    vk: VkBot,
    tg: TgBot,
    viber: ViberBot,
    image: ImageService,
    vkApp: VKApp,
    api: Api,
    alice: AliceApp,
    parser: ParserService,
    google_calendar: GoogleService
} as const;

type Services = typeof services;
export type AppServiceName = keyof Services;

export class App {
    public logger: Logger = new Logger('CORE');

    private services: Map<AppServiceName, AppService> = new Map();
    private init: boolean = false;

    constructor(initialServices: AppServiceName[] = []) {
        for (const service of initialServices) {
            this.registerService(service);
        }
    }

    public registerService(service: AppServiceName): void {
        const classHandler = services[service];
        const handler = new classHandler(this);

        this.services.set(service, handler);

        if (this.init) {
            handler.run();
        }
    }

    public getService<TServiceName extends AppServiceName & string, TService = InstanceType<Services[TServiceName]>>(service: TServiceName): TService {
        const serviceInstance = this.services.get(service);

        if (!serviceInstance) {
            throw new Error(`Service '${String(service)}' not registered`);
        }

        return serviceInstance as TService;
    }

    public isServiceRegistered(service: AppServiceName): boolean {
        return this.services.has(service);
    }

    public async runServices(): Promise<void> {
        this.logger.log('Запуск...')

        const promises: Promise<any>[] = [];

        this.init = true;

        this.logger.log('Подключение к БД...');
        await sequelize.sync();
        this.logger.log('Подключение к БД: Успешно!');

        for (const [serviceId, service] of this.services) {
            promises.push(service.run());
        }

        await Promise.all(promises);

        this.logger.log('Проект успешно запущен');
        this.logger.log('Загруженные сервисы:', this.getServiceList().join(', '));
    }

    public getServiceList(): Array<string> {
        return Array.from(this.services.keys());
    }
}
