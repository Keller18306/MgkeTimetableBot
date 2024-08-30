import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes } from "sequelize";
import { UserDetails } from "viber-bot";
import { config } from "../../../../config";
import { sequelize } from "../../../db";
import { BotServiceName } from "../abstract";
import { AbstractServiceChat, BotChat } from "../chat";
import { Theme } from "./keyboardBuilder";

const updateDITime: number = 12 * 60 * 60 * 1000;

class ViberChat extends AbstractServiceChat<InferAttributes<ViberChat>, InferCreationAttributes<ViberChat>> {
    public static service: BotServiceName = 'viber';

    declare peerId: string;

    /** Тема кнопок в Viber (цвет: бело-розовые, тёмно-синие, серо-чёрные) */
    declare theme: CreationOptional<Theme>;

    /** Время последнего обновления User Details */
    declare lastUpdateDI: CreationOptional<number>;

    /** Имя юзера в Viber */
    declare name: CreationOptional<string | null>;

    /** Операционная система пользователя (Android, IOS, ... + version) */
    declare device_os: CreationOptional<string | null>;

    /** Полная модель телефона */
    declare device_type: CreationOptional<string | null>;

    /** Версия Viber */
    declare viber_version: CreationOptional<string | null>;

    // protected defaultAllowSendMess: boolean = false; //todo

    public needUpdateUserDetails(): boolean {
        return Date.now() - this.lastUpdateDI >= updateDITime
    }

    public async setUserDetails(userDetails: UserDetails) {
        this.name = userDetails.name;
        this.device_os = userDetails.primary_device_os;
        this.viber_version = userDetails.viber_version;
        this.device_type = userDetails.device_type;
        this.lastUpdateDI = Date.now();

        await this.save();
    }

    public isSuperAdmin(): boolean {
        return config.viber.admin_ids.includes(this.peerId)
    }
}

ViberChat.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chatId: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
    },
    peerId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    theme: {
        type: DataTypes.ENUM<Theme>('white', 'dark', 'black'),
        defaultValue: 'white'
    },
    lastUpdateDI: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    device_os: {
        type: DataTypes.STRING,
        allowNull: true
    },
    device_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    viber_version: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'bot_chats_viber'
});

ViberChat.belongsTo(BotChat, {
    foreignKey: 'chatId',
    targetKey: 'id',
    as: 'serviceChat'
});

BotChat.hasOne(ViberChat, {
    sourceKey: 'id',
    foreignKey: 'chatId'
});

export { ViberChat };

