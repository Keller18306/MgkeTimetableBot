import { CallbackQueryContext as TgRealCallbackContext } from 'puregram'
import { ContextDefaultState, MessageEventContext } from 'vk-io'
import { App } from '../../../app'
import { ScheduleFormatter } from "../../../utils/formatters/abstract"
import { ServiceStorage } from '../../storage'
import { Keyboard } from "../keyboard"
import { TgChat } from "../tg/chat"
import { TgCallbackContext } from '../tg/context'
import { VkChat } from "../vk/chat"
import { VkCallbackContext } from '../vk/context'
import { AbstractChat } from "./chat"
import { Service } from "./command"
import { AbstractCallbackContext } from './context'

export type CbHandlerParams = {
    context: AbstractCallbackContext,
    realContext: any,
    chat: AbstractChat,
    keyboard: Keyboard,
    service: Service,
    scheduleFormatter: ScheduleFormatter,
    cache: ServiceStorage
} & ({
    service: 'vk',
    context: VkCallbackContext,
    realContext: MessageEventContext<ContextDefaultState>,
    chat: VkChat
} | {
    service: 'tg',
    context: TgCallbackContext,
    realContext: TgRealCallbackContext,
    chat: TgChat
})

export abstract class AbstractCallback {
    public id?: string;

    public adminOnly: boolean = false;
    public acceptRequired: boolean = true;
    public services: Service[] = [
        'vk', 'tg'
    ];

    public abstract action: string;

    public abstract handler(params: CbHandlerParams): any | Promise<any>

    constructor(protected app: App) { }

    public preHandle({ service, chat }: CbHandlerParams) {
        if (!this.services.includes(service)) {
            return false;
        }

        if (this.adminOnly && !chat.isAdmin) {
            return false;
        }

        return true;
    }
}