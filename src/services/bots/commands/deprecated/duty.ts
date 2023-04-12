import { DefaultCommand, HandlerParams, Service } from "../../abstract/command";
import { sendTodayDuty, sendTomorrowDuty } from "../../vk/duter";

export default class extends DefaultCommand {
    public id = 'get_duty'

    public regexp = /^(!|\/)duty$/i
    public payload = null;

    public services: Service[] = ['vk'];

    handler({ context, chat, chatData, service }: HandlerParams) {
        if (service !== 'vk') throw new Error('Service is not vk')
        const hour = new Date().getHours()

        if (hour < 18) sendTodayDuty(chatData)
        else sendTomorrowDuty(chatData)
    }
}