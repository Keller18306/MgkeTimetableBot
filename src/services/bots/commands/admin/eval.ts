import * as crypto from 'crypto';
import * as fs from 'fs';
import { TelegramBotCommand } from 'puregram/generated';
import { runInNewContext } from 'vm';
import db from '../../../../db';
import { raspCache } from "../../../../updater";
import { AbstractCommand, HandlerParams } from "../../abstract";
import { CommandController } from "../../command";
import { VkBot } from "../../vk";

const cmds = CommandController.instance.commands
const vk = VkBot.instance.vk

export default class extends AbstractCommand {
    public id = 'eval'
    public regexp = /^(!|\/)eval/i
    public payload = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'eval',
        description: 'Выполнение произвольного JavaScript кода в услово изолированной среде'
    };

    async handler({ context, chat }: HandlerParams) {
        const code = context.text?.replace(this.regexp, '').trim()
        if (code === undefined) return context.send('Код для выполнения не введён');

        let error: string | null = null
        let execTime: number;
        let result: any;

        execTime = Date.now()
        try {
            result = await runInNewContext(code, {
                global, clearInterval, clearTimeout, setInterval,
                setTimeout, queueMicrotask, clearImmediate, setImmediate,
                context, vk, fs, crypto, require, process, Buffer,
                cmds, console, db, raspCache, chat
            }, {
                timeout: 10000
            })
        } catch (e: any) {
            error = e.toString()
        }
        execTime = Date.now() - execTime

        if (error) return context.send(
            'Произошла ошибка во время выполнения:\n' +
            `${error}\n\n` +
            `Время выполнения: ${execTime}мс.`
        )

        try {
            if (typeof result === 'object') result = JSON.stringify(result, null, 4)
        } catch (e) { }

        if (result !== undefined) context.send(`${result}`.substr(0, 4096))

        context.send(
            'Выполнено без ошибок\n' +
            `Время выполнения: ${execTime}мс.`
        )
    }
}