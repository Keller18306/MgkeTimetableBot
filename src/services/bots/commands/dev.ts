import { AbstractCommand, HandlerParams } from "../abstract";

export default class extends AbstractCommand {
    public id = 'get_dev'

    public regexp = /^(!|\/)dev$/i
    public payload = null;

    handler({ context }: HandlerParams) {
        return context.send([
            'Привет! Хочешь помочь сделать бота лучше? Окей, бегом на гитхаб) Там всё расписано.',
            'https://github.com/Keller18306/MgkeTimetableBot'
        ].join('\n\n'))
    }
}