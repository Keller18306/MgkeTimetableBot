import { ContextDefaultState, MessageEventContext } from 'vk-io';
import { VkChat, VkDb } from '../chat';

export type HandlerParams = {
    context: MessageEventContext<ContextDefaultState>,
    chat: VkChat,
    chatData: VkDb
}

export abstract class DefaultCallback {
    public id?: string;

    abstract action: string;

    abstract handler(params: HandlerParams): any | Promise<any>
}