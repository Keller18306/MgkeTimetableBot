import {
    Attributes, CreationAttributes, CreationOptional, DataTypes, InferAttributes,
    InferCreationAttributes, Model, ModelStatic, NonAttribute, NonNullFindOptions
} from 'sequelize';
import { sequelize } from '../../../db';
import { arrayUnique } from '../../../utils';
import { BotServiceName } from '../abstract';
import { AbstractServiceChat } from './Abstract';
import { AliasRecords, LessonAlias } from './LessonAlias';

export type ChatMode = 'student' | 'teacher' | 'parent' | 'guest';
const SEARCH_HISTORY_LENGTH: number = 3;

class BotChat<T extends AbstractServiceChat = any> extends Model<InferAttributes<BotChat<T>>, InferCreationAttributes<BotChat<T>>> {
    public static async findByServicePeerId<T extends AbstractServiceChat = any>(model: ModelStatic<T>, peerId: string | number, creationDefaults?: Partial<CreationAttributes<BotChat>>): Promise<BotChat<T>> {
        const findOptions: NonNullFindOptions<Attributes<BotChat<T>>> = {
            where: {
                [`$${model.name}.peerId$`]: peerId
            } as any,
            include: {
                association: BotChat.associations[model.name],
                required: true
            },
            rejectOnEmpty: false
        }

        const chat = await this.findOne<BotChat<T>>(findOptions);
        if (!chat && creationDefaults) {
            await this._createChat(model, peerId, creationDefaults);

            return this.findByServicePeerId(model, peerId);
        } else if (!chat) {
            throw new Error('Chat not found')
        }

        chat.serviceChat = (chat as any)[model.name];

        return chat;
    }

    private static _createChat<T extends AbstractServiceChat = any>(model: ModelStatic<T>, peerId: string | number, creationDefaults: Partial<CreationAttributes<BotChat>>) {
        return this.create({
            ...creationDefaults,
            service: (model as any).service,
            [model.name]: {
                peerId: peerId
            }
        }, {
            include: BotChat.associations[model.name],
            returning: false
        });
    }

    public async getLessonAliases(): Promise<AliasRecords> {
        const aliases = await LessonAlias.findAll({
            where: {
                chatId: this.id
            }
        });

        return aliases.reduce((current: any, alias) => {
            current[alias.lesson] = alias.alias;

            return current;
        }, {});
    }

    // declare primaryId: CreationOptional<number>;
    declare id: CreationOptional<number>;

    declare service: BotServiceName;
    // declare id: number;

    /** Есть ли доступ к боту */
    declare accepted: CreationOptional<boolean>;

    /** Откуда пришёл юзер */
    declare ref: string | null;

    /** Текущая сцена */
    declare scene: string | null;

    /** Режим чата (ученик, преподаватель, родитель) */
    declare mode: ChatMode | null;

    /** Выбранная группа для ученика */
    declare group: string | null;

    /** Выбранное имя для преподавателя */
    declare teacher: string | null;

    /** Почта привязанного гугл аккаунта */
    declare googleEmail: string | null;

    /** Показывать ли кнопку "О боте" */
    declare showAbout: CreationOptional<boolean>;

    /** Показывать ли кнопку "На день" */
    declare showDaily: CreationOptional<boolean>;

    /** Показывать ли кнопку "На неделю" */
    declare showWeekly: CreationOptional<boolean>;

    /** Показывать ли кнопку "Звонки" */
    declare showCalls: CreationOptional<boolean>;

    /** Показывать ли кнопку "Группа" для быстрого получения группы */
    declare showFastGroup: CreationOptional<boolean>;

    /** Показывать ли кнопку "Преподаватель" для быстрого получения преподавателя */
    declare showFastTeacher: CreationOptional<boolean>;

    /** Скрывать ли прошедшие дни в расписаннии на неделю */
    declare hidePastDays: CreationOptional<boolean>;

    /** Удалять ли последнее сообщение в чате от бота */
    declare deleteLastMsg: CreationOptional<boolean>;

    /** Последний ID сообщения бота с расписанием */
    declare lastMsgId: number | null;

    /** Время последнего сообщения к боту */
    declare lastMsgTime: CreationOptional<number>;

    /** Удалять ли сообщение человека в чате после вызова расписания */
    declare deleteUserMsg: CreationOptional<boolean>;

    /** Разрешено ли отправлять сообщения */
    declare allowSendMess: CreationOptional<boolean>;

    /** Подписка на рассылку */
    declare subscribeDistribution: CreationOptional<boolean>;

    /** Оповещать ли о добавлении дней */
    declare noticeChanges: CreationOptional<boolean>;

    /** Оповещать ли о добавлении новой недели */
    declare noticeNextWeek: CreationOptional<boolean>;

    /** Оповещать ли при ошибках парсера (если 3 последние одинаковые ошибки) */
    declare noticeParserErrors: CreationOptional<boolean>;

    /** Нужно ли принудительно обновить кнопки */
    declare needUpdateButtons: CreationOptional<boolean>;

    /** Нужно ли отображать время последнего обновления расписания */
    declare showParserTime: CreationOptional<boolean>;

    /** Показывать ли подсказки под расписанием */
    declare showHints: CreationOptional<boolean>;

    /** Было ли показано сообщение о еуле */
    declare eula: CreationOptional<boolean>;

    /** История поиска групп */
    declare historyGroup: CreationOptional<string[]>;

    /** История поиска преподавателей */
    declare historyTeacher: CreationOptional<string[]>;

    /** Какое форматирование расписания использовать */
    declare scheduleFormatter: CreationOptional<number>;

    /**
     * Отключить проверку по текущему режиму для оповещений о добавлении дней.
     * Если указана группа/преподаватель, то будут всё равно приходить оповещения, даже если не выбран режим
    */
    declare deactivateSecondaryCheck: CreationOptional<boolean>;

    declare serviceChat: NonAttribute<T>;

    public appendGroupHistory(group: string) {
        const history = Array.from(this.historyGroup);

        history.unshift(group);

        this.historyGroup = history;
    }

    public appendTeacherHistory(teacher: string) {
        const history = Array.from(this.historyTeacher);

        history.unshift(teacher);

        this.historyTeacher = history;
    }

    // public getTimetableConditions() {
    //     switch (this.mode) {
    //         case 'parent':
    //         case 'student':
    //             if (!this.group) {
    //                 throw new Error('group not selected');
    //             }

    //             return {
    //                 type: 'group',
    //                 value: this.group
    //             }

    //         case 'teacher':
    //             if (!this.teacher) {
    //                 throw new Error('teacher not selected');
    //             }

    //             return {
    //                 type: 'teacher',
    //                 value: this.teacher
    //             }
    //         default:
    //             throw new Error('Chat mode does not support this function');
    //     }
    // }
}

BotChat.init({
    id: {
        type: DataTypes.INTEGER, //todo
        primaryKey: true,
        autoIncrement: true
    },
    // primaryId: {
    //     type: DataTypes.INTEGER,
    //     primaryKey: true,
    //     autoIncrement: true
    // },
    service: {
        type: DataTypes.ENUM<BotServiceName>('vk', 'viber', 'tg'),
        allowNull: false
    },
    // id: {
    //     type: DataTypes.INTEGER, //todo
    //     allowNull: false
    // },
    accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ref: DataTypes.STRING,
    scene: DataTypes.STRING,
    mode: DataTypes.ENUM('student', 'teacher', 'parent', 'guest'),
    group: DataTypes.STRING,
    teacher: DataTypes.STRING,
    googleEmail: DataTypes.STRING,
    showAbout: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    showDaily: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    showWeekly: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    showCalls: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    showFastGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    showFastTeacher: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    hidePastDays: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    deleteLastMsg: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastMsgId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    lastMsgTime: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    deleteUserMsg: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    allowSendMess: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    subscribeDistribution: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    noticeChanges: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    noticeNextWeek: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    noticeParserErrors: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    needUpdateButtons: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    showParserTime: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    showHints: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    historyGroup: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '[]',

        get() {
            try {
                return JSON.parse(this.getDataValue('historyGroup') as any)
                    .slice(0, SEARCH_HISTORY_LENGTH);
            } catch (e) {
                return [];
            }
        },

        set(value: string[]) {
            const str = JSON.stringify(arrayUnique(value).slice(0, SEARCH_HISTORY_LENGTH));
            this.setDataValue('historyGroup', str as any);
        },
    },
    historyTeacher: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '[]',

        get() {
            try {
                return JSON.parse(this.getDataValue('historyTeacher') as any)
                    .slice(0, SEARCH_HISTORY_LENGTH);
            } catch (e) {
                return [];
            }
        },

        set(value: string[]) {
            const str = JSON.stringify(arrayUnique(value).slice(0, SEARCH_HISTORY_LENGTH));
            this.setDataValue('historyTeacher', str as any);
        },
    },
    scheduleFormatter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    eula: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deactivateSecondaryCheck: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize: sequelize,
    tableName: 'bot_chats',
    indexes: [
        {
            fields: ['service', 'id'],
            unique: true
        },
        {
            fields: ['service']
        },
        {
            fields: ['mode', 'group']
        },
        {
            fields: ['mode', 'teacher']
        },
        {
            fields: ['accepted', 'allowSendMess'],
        },
        {
            fields: ['subscribeDistribution']
        },
        {
            fields: ['noticeChanges']
        },
        {
            fields: ['noticeNextWeek']
        },
        {
            fields: ['deactivateSecondaryCheck']
        }
    ]
});

export { BotChat };

