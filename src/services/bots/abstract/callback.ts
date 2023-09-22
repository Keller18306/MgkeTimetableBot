import { CallbackQueryContext as TgCallbackContext } from 'puregram'
import { ContextDefaultState, MessageEventContext } from 'vk-io'
import { ScheduleFormatter } from "../../../utils/formatters/abstract"
import { Keyboard } from "../keyboard"
import { TgChat } from "../tg/chat"
import { VkChat } from "../vk/chat"
import { AbstractChat } from "./chat"
import { Service } from "./command"
import { AbstractCallbackContext } from './context'

export type CbHandlerParams = {
    context: AbstractCallbackContext,
    realContext: any,
    chat: AbstractChat,
    keyboard: Keyboard,
    service: Service,
    scheduleFormatter: ScheduleFormatter
} & ({
    service: 'vk',
    // context: VkCommandContext,
    realContext: MessageEventContext<ContextDefaultState>,
    chat: VkChat
} | {
    service: 'tg',
    // context: TgCommandContext,
    realContext: TgCallbackContext,
    chat: TgChat
})

export abstract class AbstractCallback {
    public id?: string;

    public adminOnly: boolean = false;
    public services: Service[] = [
        'vk', 'tg'
    ];

    abstract action: string;
    
    abstract handler(params: CbHandlerParams): any | Promise<any>

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