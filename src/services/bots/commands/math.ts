import { runInNewContext } from 'vm';
import { AbstractCommand, CmdHandlerParams } from '../abstract';

export default class extends AbstractCommand {
    public regexp = /^(!|\/)math/i
    public payload = null;

    async handler({ context }: CmdHandlerParams) {
        const cmd = context.text!.split(' ')[0]

        let text = context.text!.split(' ').slice(1).join(' ')
        if (text === '') return context.send(this.info(cmd))

        let error: string | null = null
        let result: any;

        text = text.replace(/ /g, '')

        const allowStrings: string = '0123456789+-*/():^×÷ekк,.'
        let allowed: boolean = true
        for (const char of text) {
            if (allowStrings.includes(char)) continue;
            allowed = false
            break;
        }

        if (!allowed) return context.send(
            'В примере имеются лишние символы.\n' +
            `Список разрешённых: ${allowStrings}`
        )

        const replace: { [key: string]: string } = {
            '\\^': '**',
            '×': '*',
            '÷': '/',
            ':': '/',
            'k': '000',
            'к': '000',
            ',': '.'
        }

        for (const from in replace) {
            const to = replace[from]
            text = text.replace(new RegExp(from, 'gi'), to)
        }

        let correct: boolean = true

        if (text.split('(').length != text.split(')').length) correct = false
        if (correct && !'(0123456789'.includes(text[0])) correct = false
        if (correct && !')0123456789'.includes(text[text.length - 1])) correct = false
        if (
            correct &&
            text.split('(').length > 1 &&
            !text.includes('/') &&
            !text.includes('*') &&
            !text.includes('+') &&
            !text.includes('-')
        ) correct = false

        if (!correct) return context.send(
            'Пример записан неправильно'
        )

        try {
            result = await runInNewContext(text, undefined, {
                timeout: 100
            })
        } catch (e: any) {
            error = e.toString()
        }

        //console.log(text, result, error)

        if (error) return context.send(
            'Произошла ошибка во время выполнения:\n' +
            `${error}`
        )

        if (result === Infinity) return context.send(
            'бесконечность'
        )

        if (typeof result !== 'number') return context.send(
            'Выходящий тип данных почему-то не равен number'
        )

        return context.send(`${result}`.substring(0, 4096))
    }

    info(cmd: string) {
        return `${cmd} <some>\n` +
            '<some> - математический пример'
    }
}