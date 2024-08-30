import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes } from "sequelize";
import { config } from "../../../../config";
import { sequelize } from "../../../db";
import { BotServiceName } from "../abstract";
import { AbstractServiceChat, BotChat } from "../chat";

class VkChat extends AbstractServiceChat<InferAttributes<VkChat>, InferCreationAttributes<VkChat>> {
    public static service: BotServiceName = 'vk';

    declare peerId: number;

    /** Разрешено ли юзеру подтвердить себе приложение ВК, если оно не было подтверждено */
    declare allowVkAppAccept: CreationOptional<boolean>;

    public isSuperAdmin(): boolean {
        if (this.peerId > 2e9) return false;

        return config.vk.admin_ids.includes(this.peerId)
    }
}

VkChat.init({
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
        type: DataTypes.BIGINT,
        unique: true,
        allowNull: false,

        get(): number {
            return Number(this.getDataValue('peerId'))
        }
    },
    allowVkAppAccept: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize: sequelize,
    tableName: 'bot_chats_vk'
});

VkChat.belongsTo(BotChat, {
    foreignKey: 'chatId',
    targetKey: 'id',
    as: 'serviceChat'
});

BotChat.hasOne(VkChat, {
    sourceKey: 'id',
    foreignKey: 'chatId'
});

export { VkChat };

