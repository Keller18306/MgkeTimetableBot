import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(vtt?|voice(to)?text)$/i
    public payloadAction = null;

    public services: ("vk" | "tg" | "viber")[] = ['vk'];

    handler({ context, service, realContext }: CmdHandlerParams) {
        if (service != 'vk') throw new Error('Команда доступна только в ВК')

        if (!realContext.replyMessage) return context.send('На сообщение нужно ответить')

        const audio = realContext.replyMessage.attachments[0] as any

        if (
            realContext.replyMessage.attachments.length != 1 &&
            audio.type != 'audio_message'
        ) return context.send('Это не голосовуха')

        if (!audio.isTranscriptDone) return context.send('Транскрипция ещё не готова')

        return context.send(
            `Текст голосовой:\n${audio.transcript}`
        )
    }
}