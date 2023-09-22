import { MessageContext as TgMessageContext } from 'puregram';
import { TelegramBotCommand } from 'puregram/generated';
import { ContextDefaultState, MessageContext as VkMessageContext } from 'vk-io';
import { raspCache } from '../../../updater';
import { ScheduleFormatter } from '../../../utils/formatters/abstract';
import { Keyboard, StaticKeyboard, withCancelButton } from '../keyboard';
import { TgChat } from '../tg/chat';
import { TgCommandContext } from '../tg/context';
import { ViberChat } from '../viber/chat';
import { ViberCommandContext, ViberContext } from '../viber/context';
import { VkChat } from '../vk/chat';
import { VkCommandContext } from '../vk/context';
import { AbstractAction } from './action';
import { AbstractChat } from './chat';
import { AbstractCommandContext } from './context';
import { KeyboardBuilder } from './keyboardBuilder';

export type Service = 'tg' | 'vk' | 'viber';

export type CmdHandlerParams = {
    context: AbstractCommandContext,
    realContext: any,
    chat: AbstractChat,
    actions: AbstractAction,
    keyboard: Keyboard,
    service: Service,
    scheduleFormatter: ScheduleFormatter
} & ({
    service: 'vk',
    context: VkCommandContext,
    realContext: VkMessageContext<ContextDefaultState>,
    chat: VkChat
} | {
    service: 'viber',
    context: ViberCommandContext,
    realContext: ViberContext,
    chat: ViberChat
} | {
    service: 'tg',
    context: TgCommandContext,
    realContext: TgMessageContext,
    chat: TgChat
})

export abstract class AbstractCommand {
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

    public abstract handler(params: CmdHandlerParams): any | Promise<any>

    public preHandle({ service, chat }: CmdHandlerParams) {
        if (!this.services.includes(service)) {
            return false;
        }

        if (this.adminOnly && !chat.isAdmin) {
            return false;
        }

        return true;
    }

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
            await context.send('Данный преподаватель не найден', {
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
                'Найдено несколько преподавателей.\n' +
                'Какой именно нужен?\n\n' +
                matched.join('\n'), {
                keyboard: withCancelButton(keyboard.generateVerticalKeyboard(matched))
            })

            return undefined;
        }

        return matched[0];
    }
}

