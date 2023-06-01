import { MessageContext as TgMessageContext } from 'puregram';
import { TelegramBotCommand } from 'puregram/generated';
import { ContextDefaultState, MessageContext as VkMessageContext } from 'vk-io';
import { raspCache } from '../../../updater';
import { ScheduleFormatter } from '../../../utils/formatters/abstract';
import { ImageFile } from '../../image/builder';
import { BotInput } from '../input';
import { Keyboard, StaticKeyboard, withCancelButton } from '../keyboard';
import { TgChat, TgDb } from '../tg/chat';
import { TgCommandContext } from '../tg/context';
import { ViberChat, ViberDb } from '../viber/chat';
import { ViberCommandContext, ViberContext } from '../viber/context';
import { VkChat, VkDb } from '../vk/chat';
import { VkCommandContext } from '../vk/context';
import { AbstractAction } from './action';
import { AbstractChat, DbChat } from './chat';
import { KeyboardBuilder } from './keyboardBuilder';

export type Service = 'tg' | 'vk' | 'viber';

export type AdvancedContext = {
    hasMention: boolean,
    mentionId: number,
    mentionMessage?: string,
    selfMention: boolean
}

export type HandlerParams = {
    context: AbstractCommandContext,
    realContext: any,
    adv_context: AdvancedContext,
    chat: AbstractChat,
    chatData: DbChat,
    actions: AbstractAction,
    keyboard: Keyboard,
    service: Service,
    scheduleFormatter: ScheduleFormatter
} & ({
    service: 'vk',
    context: VkCommandContext,
    realContext: VkMessageContext<ContextDefaultState>,
    chat: VkChat,
    chatData: VkDb
} | {
    service: 'viber',
    context: ViberCommandContext,
    realContext: ViberContext,
    chat: ViberChat,
    chatData: ViberDb
} | {
    service: 'tg',
    context: TgCommandContext,
    realContext: TgMessageContext,
    chat: TgChat,
    chatData: TgDb
})

export abstract class DefaultCommand {
    public id?: string;
    public acceptRequired: boolean = true;
    public adminOnly: boolean = false;
    public tgCommand: TelegramBotCommand | null = null;

    public services: Service[] = [
        'vk', 'viber', 'tg'
    ];

    public abstract regexp: RegExp | null;
    public abstract payload: string | null;

    /**
     * Сцена, в которой будет работать команда.
     * 
     * null - работа только в главной сцене
     * string - работа в указанной сцене
     * undefined - работа в любой сцене
     */
    public scene?: string | null;

    public preHandle(params: HandlerParams) {
        if (!this.services.includes(params.service)) return false;

        return true;
    }

    public abstract handler(params: HandlerParams): any | Promise<any>

    protected async findGroup(context: AbstractCommandContext, keyboard: Keyboard, group: string | undefined, errorKeyboard: KeyboardBuilder | undefined = StaticKeyboard.Cancel): Promise<false | number> {
        if (!group || isNaN(+group)) {
            await context.send('Это не число', {
                keyboard: errorKeyboard
            });

            return false;
        }

        if (group.length > 3) {
            await context.send('Номер группы введён неверно', {
                keyboard: errorKeyboard
            });

            return false;
        }

        if (!Object.keys(raspCache.groups.timetable).includes(group)) {
            await context.send('Данной учебной группы не существует', {
                keyboard: errorKeyboard
            })

            return false;
        }

        return Number(group);
    }

    protected async findTeacher(context: AbstractCommandContext, keyboard: Keyboard, teacher: string | undefined, errorKeyboard: KeyboardBuilder | undefined = StaticKeyboard.Cancel): Promise<false | undefined | string> {
        if (!teacher || teacher.length < 3) {
            await context.send('Фамилия введена некорректно', {
                keyboard: errorKeyboard
            })
            return false;
        }

        const matched: string[] = []
        const matchLimit: number = 5;

        const fullTeachersList: string[] = Object.keys(raspCache.teachers.timetable)

        for (const sys_teacher of fullTeachersList) {
            if (sys_teacher.toLocaleLowerCase().search(teacher.toLocaleLowerCase()) === -1) continue;

            if (sys_teacher.toLocaleLowerCase() === teacher.toLocaleLowerCase()) {
                matched.push(sys_teacher)
                break;
            }

            matched.push(sys_teacher)
            if (matched.length > matchLimit) break;
        }

        if (matched.length === 0) {
            await context.send('Данный учитель не найден', {
                keyboard: errorKeyboard
            });

            return false;
        }
        if (matched.length > matchLimit) {
            await context.send('Слишком много результатов для выборки.', {
                keyboard: errorKeyboard
            })

            return false;
        }
        if (matched.length > 1) {
            await context.send(
                'Найдено несколько учителей.\n' +
                'Какой именно нужен?\n\n' +
                matched.join('\n'), {
                keyboard: withCancelButton(keyboard.generateVerticalKeyboard(matched))
            })

            return undefined;
        }

        return matched[0];
    }
}

export type MessageOptions = {
    keyboard?: KeyboardBuilder,
    reply_to?: string,
    disable_mentions?: boolean
}

export abstract class AbstractCommandContext {
    public abstract id: string;
    public abstract text: string
    public abstract payload?: { [key: string]: any };

    public abstract peerId: number | string;
    public abstract userId: number | string;

    public abstract get isChat(): boolean;

    public abstract send(text: string, options?: MessageOptions): Promise<string>
    public abstract sendPhoto(image: ImageFile, options?: MessageOptions): Promise<string>
    public abstract delete(id: string): Promise<boolean>
    public abstract isAdmin(): Promise<boolean>

    public readonly _input: BotInput;

    constructor(input: BotInput) {
        this._input = input;
    }

    public async input(text: string, options?: MessageOptions | undefined): Promise<string | undefined> {
        const answer = this._input.create(String(this.peerId))

        await this.send(text, options)

        return answer
    }

    public cancelInput() {
        this._input.cancel(String(this.peerId))
    }

    public async waitInput() {
        return this._input.create(String(this.peerId));
    }
}
