import { MessageContext as TgMessageContext } from 'puregram';
import { TelegramBotCommand } from 'puregram/generated';
import { ContextDefaultState, MessageContext as VkMessageContext } from 'vk-io';
import { App, AppServiceName } from '../../../app';
import { ScheduleFormatter } from '../../../formatter';
import { raspCache } from '../../parser';
import { AbstractServiceChat, BotChat } from '../chat';
import { Keyboard, StaticKeyboard, withCancelButton } from '../keyboard';
import { Storage } from '../storage';
import { TgChat } from '../tg/chat';
import { TgCommandContext } from '../tg/context';
import { ViberChat } from '../viber/chat';
import { ViberCommandContext, ViberContext } from '../viber/context';
import { VkChat } from '../vk/chat';
import { VkCommandContext } from '../vk/context';
import { AbstractAction } from './action';
import { AbstractCommandContext } from './context';
import { KeyboardBuilder } from './keyboardBuilder';

export type BotServiceName = 'tg' | 'vk' | 'viber';

export type CmdHandlerParams<C extends AbstractCommand = any> = {
    context: AbstractCommandContext,
    realContext: VkMessageContext<ContextDefaultState> | ViberContext | TgMessageContext,
    serviceChat: AbstractServiceChat,
    chat: BotChat,
    regexp?: C['regexp'] extends RegExp ? 'index' : keyof C['regexp'],
    actions: AbstractAction,
    keyboard: Keyboard,
    service: BotServiceName,
    formatter: ScheduleFormatter,
    cache: Storage
} & ({
    service: 'vk',
    context: VkCommandContext,
    realContext: VkMessageContext<ContextDefaultState>,
    serviceChat: VkChat
} | {
    service: 'viber',
    context: ViberCommandContext,
    realContext: ViberContext,
    serviceChat: ViberChat
} | {
    service: 'tg',
    context: TgCommandContext,
    realContext: TgMessageContext,
    serviceChat: TgChat
})

export abstract class AbstractCommand {
    /**
    * Уникальный идентификатор команды, устанавливается во время загрузки команд
    **/
    public id?: string;

    /**
    * Должен ли быть чат подверждённым, чтобы использовать эту команду
    **/
    public acceptRequired: boolean = true;

    /**
    * Доступна ли эта команда только для админов?
    **/
    public adminOnly: boolean = false;

    /**
    * Базовая команда и её описания для регистрации её в списке команд в помощи (и для списка телеги)
    **/
    public tgCommand: TelegramBotCommand | TelegramBotCommand[] | null = null;

    /**
    * Список сервисов ботов, в которых команда будет работать
    * (если undefined, во всех серисах)
    **/
    public services?: BotServiceName[];

    /**
    * Список сервисов, необходимые для работы команды
    * (если undefined, команда регистрируется всегда, если же указанный сервис не загружен, то и команда не будет загружена)
    **/
    public requireServices?: AppServiceName[];

    /**
    * Регулярное выражение для команды, по котрому она будет вызываться
    **/
    public abstract regexp: { [regexp: string]: RegExp } | RegExp | null;

    /**
     * Если указан, то команда будет вызываться при указанном действии
     * если совпадают payload.action
     */
    public abstract payloadAction: string | null;

    /**
     * Сцена, в которой будет работать команда.
     * (не работает для payload)
     * 
     * null - работа только в главной сцене
     * string - работа в указанной сцене
     * undefined - работа в любой сцене
     */
    public scene?: string | null;

    public abstract handler(params: CmdHandlerParams): any | Promise<any>

    constructor(protected app: App) { }

    public preHandle({ service, serviceChat: chat }: CmdHandlerParams) {
        if (this.services && !this.services.includes(service)) {
            return false;
        }

        if (this.adminOnly && !chat.isSuperAdmin()) {
            return false;
        }

        return true;
    }

    protected async findGroup({ context }: CmdHandlerParams, group?: string, errorKeyboard: KeyboardBuilder = StaticKeyboard.Cancel): Promise<false | string> {
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

        if (!raspCache.groups.timetable[group]) {
            await context.send('Данной учебной группы не существует', {
                keyboard: errorKeyboard
            })

            return false;
        }

        return group;
    }

    protected async findTeacher({ context, keyboard }: CmdHandlerParams, teacher?: string, errorKeyboard: KeyboardBuilder = StaticKeyboard.Cancel): Promise<false | undefined | string> {
        if (!teacher || teacher.length < 3) {
            await context.send('Фамилия введена некорректно', {
                keyboard: errorKeyboard
            });

            return false;
        }

        const matched: string[] = [];
        const matchLimit: number = 5;

        const shortTeachersList: string[] = Object.keys(raspCache.teachers.timetable);
        for (const sys_teacher of shortTeachersList) {
            const search = teacher.replaceAll('.', '').toLocaleLowerCase();
            const needle = sys_teacher.replaceAll('.', '').toLocaleLowerCase();

            if (needle.search(search) === -1) continue;

            if (needle.toLocaleLowerCase() === search) {
                matched.push(sys_teacher);
                break;
            }

            matched.push(sys_teacher);
            if (matched.length > matchLimit) break;
        }

        for (const sys_teacher in raspCache.team.names) {
            if (matched.length > matchLimit) break;
            if (matched.includes(sys_teacher)) continue;

            const fullTeacher = raspCache.team.names[sys_teacher];

            if (fullTeacher.toLocaleLowerCase().search(teacher.toLocaleLowerCase()) === -1) continue;

            matched.push(sys_teacher);
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

