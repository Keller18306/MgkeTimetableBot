import * as crypto from 'crypto';
import * as fs from 'fs';
import { TelegramBotCommand } from 'puregram/generated';
import { runInNewContext } from 'vm';
import { sequelize } from '../../../../db';
import { loadCache, raspCache, saveCache } from "../../../parser/raspCache";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)eval/i
    public payloadAction = null;
    public adminOnly: boolean = true;
    public tgCommand: TelegramBotCommand = {
        command: 'eval',
        description: 'Выполнение произвольного JavaScript кода в услово изолированной среде'
    };

    async handler({ context, chat, serviceChat }: CmdHandlerParams) {
        const code = context.text?.replace(this.regexp, '').trim()
        if (code === undefined) {
            return context.send('Код для выполнения не введён');
        }

        let error: string | null = null
        let execTime: number;
        let result: any;

        execTime = Date.now()
        try {
            result = await runInNewContext(code, {
                app: this.app,
                global, clearInterval, clearTimeout, setInterval,
                setTimeout, queueMicrotask, clearImmediate, setImmediate,
                context, fs, crypto, require, process, Buffer,
                console, sequelize, chat, serviceChat, raspCache, saveCache, loadCache
            }, {
                timeout: 10000
            })
        } catch (e: any) {
            error = e.toString()
        }
        execTime = Date.now() - execTime

        if (error) {
            return context.send(
                'Произошла ошибка во время выполнения:\n' +
                `${error}\n\n` +
                `Время выполнения: ${execTime}мс.`
            );
        }

        try {
            if (typeof result === 'object') result = JSON.stringify(result, null, 4)
        } catch (e) { }

        if (result !== undefined && result !== '') {
            return context.send(`${result}`.substring(0, 4096));
        }

        return context.send(
            'Выполнено без ошибок\n' +
            `Время выполнения: ${execTime}мс.`
        );
    }
}