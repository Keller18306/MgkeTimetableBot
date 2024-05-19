import { App } from '../app';
import { BotServiceName } from '../services/bots/abstract/command';
import { BotChat } from '../services/bots/chat';
import { RaspCache } from '../services/parser/raspCache';
import { ScheduleFormatter } from './abstract';
import { DefaultScheduleFormatter } from './default';
import { LitolaxScheduleFormatter } from './litolax';
import { VisualScheduleFormatter } from './visual';

export const SCHEDULE_FORMATTERS = [
    DefaultScheduleFormatter, VisualScheduleFormatter, LitolaxScheduleFormatter
];

export function createScheduleFormatter(service: BotServiceName, app: App, raspCache: RaspCache, chat: BotChat): ScheduleFormatter {
    if (!chat) {
        return new DefaultScheduleFormatter(service, app, raspCache, chat);
    }

    if (chat.scheduleFormatter > SCHEDULE_FORMATTERS.length - 1) {
        chat.scheduleFormatter = 0;
    }

    const Formatter = SCHEDULE_FORMATTERS[chat.scheduleFormatter];

    return new Formatter(service, app, raspCache, chat);
}

export * from './abstract';
export * from './default';
export * from './litolax';
export * from './visual';