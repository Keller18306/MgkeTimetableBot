import { SCHEDULE_FORMATTERS, escapeRegex } from "../../../../../utils";
import { AbstractCommand, CmdHandlerParams } from "../../../abstract";

export default class extends AbstractCommand {
    public regexp: RegExp | null = null;
    public payload = null;
    public scene?: string | null = 'settings';

    constructor() {
        super();
        
        const regexp: string[] = [];

        for (const i in SCHEDULE_FORMATTERS) {
            const Formatter = SCHEDULE_FORMATTERS[i];

            regexp.push(escapeRegex(Formatter.label));
        }

        this.regexp = new RegExp(`^((${regexp.join('|')})(\\s\\(выбран\\))?)$`, 'i');
    }

    handler({ context, chat, keyboard }: CmdHandlerParams) {
        const formatterName: string | undefined = this.regexp?.exec(context.text)?.[2];

        let formatterIndex: number | undefined;
        for (const i in SCHEDULE_FORMATTERS) {
            const Formatter = SCHEDULE_FORMATTERS[i];
            
            if (Formatter.label === formatterName) {
                formatterIndex = +i;
                break;
            }
        }

        if (formatterIndex == undefined) {
            throw new Error('Форматировщик не найден');
        }

        const Formatter = SCHEDULE_FORMATTERS[formatterIndex];
        chat.scheduleFormatter = formatterIndex;

        return context.send(`Был успешно выбран "${Formatter.label}" форматировщик.`, {
            keyboard: keyboard.SettingsFormatters
        })
    }
}