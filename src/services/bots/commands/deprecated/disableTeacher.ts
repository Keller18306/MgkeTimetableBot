import { DefaultCommand, HandlerParams } from "../../abstract/command";

export default class extends DefaultCommand {
    public id = 'disable_teacher'

    public regexp = /^\/disableTeacher/i
    public payload = null;

    handler({ context, chat, keyboard }: HandlerParams) {
        if (chat.teacher === null) return context.send('Расписания учителя для этого чата уже отключено')

        chat.teacher = null
        chat.mode = null

        context.send(`Расписание учителя для этого чата было отключено`, {
            keyboard: keyboard.MainMenu
        })
    }
}