import { CallbackQueryContext as TgRealCallbackContext } from 'puregram'
import { ContextDefaultState, MessageEventContext } from 'vk-io'
import { App, AppServiceName } from '../../../app'
import { ScheduleFormatter } from "../../../formatter"
import { AbstractServiceChat, BotChat } from "../chat"
import { Keyboard } from "../keyboard"
import { Storage } from '../storage'
import { TgCallbackContext } from '../tg/context'
import { VkCallbackContext } from '../vk/context'
import { BotServiceName } from "./command"
import { AbstractCallbackContext } from './context'

export type CbHandlerParams = {
    context: AbstractCallbackContext,
    realContext: any,
    chat: BotChat,
    serviceChat: AbstractServiceChat,
    keyboard: Keyboard,
    service: BotServiceName,
    scheduleFormatter: ScheduleFormatter,
    cache: Storage
} & ({
    service: 'vk',
    context: VkCallbackContext,
    realContext: MessageEventContext<ContextDefaultState>,
    // chat: VkChat
} | {
    service: 'tg',
    context: TgCallbackContext,
    realContext: TgRealCallbackContext,
    // chat: TgChat
})

export abstract class AbstractCallback {
    /**
    * Уникальный идентификатор калбэка, устанавливается во время загрузки калбэков
    **/
    public id?: string;

    /**
    * Доступна ли этот калбэк только для админов?
    **/
    public adminOnly: boolean = false;

    /**
    * Должен ли быть чат подверждённым, чтобы использовать этот калбэк
    **/
    public acceptRequired: boolean = true;

    /**
    * Список сервисов ботов, в которых команда будет работать
    * (если undefined, во всех серисах)
    **/
    public services?: BotServiceName[];

    /**
    * Список сервисов, необходимые для работы команды
    * (если undefined, команда регистрируется всегда, если же указанный сервис не загружен, то и команда не будет загружена)
    **/
    public requireServices?: AppServiceName[];

    public abstract payloadAction: string;

    public abstract handler(params: CbHandlerParams): any | Promise<any>

    constructor(protected app: App) { }

    public preHandle({ service, serviceChat }: CbHandlerParams) {
        if (this.services && !this.services.includes(service)) {
            return false;
        }

        if (this.adminOnly && !serviceChat.isSuperAdmin()) {
            return false;
        }

        return true;
    }
}