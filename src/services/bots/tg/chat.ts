import { Chat, User } from "puregram";
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes } from "sequelize";
import { config } from "../../../../config";
import { sequelize } from "../../../db";
import { BotServiceName } from "../abstract";
import { AbstractServiceChat, BotChat } from "../chat";

class TgChat extends AbstractServiceChat<InferAttributes<TgChat>, InferCreationAttributes<TgChat>> {
    public static service: BotServiceName = 'tg';
    declare peerId: number;

    /** Юзернейм */
    declare domain: CreationOptional<string | null>;

    /** Отображаемое имя */
    declare firstName: CreationOptional<string | null>;

    /** Отображаемая фамилия */
    declare lastName: CreationOptional<string | null>;

    /** Язык пользователя в Telegram */
    declare lang: CreationOptional<string | null>;

    public async updateChat(chat: Chat, user?: User) {
        if (chat.id === user?.id) {
            this.domain = user.username || null;
            this.firstName = user.firstName || null;
            this.lastName = user.lastName || null;
            this.lang = user.languageCode || null;
        } else {
            this.domain = chat.username || null;
        }

        await this.save();
    }

    public isSuperAdmin(): boolean {
        return config.telegram.admin_ids.includes(this.peerId);
    }
}

TgChat.init({
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
    domain: {
        type: DataTypes.STRING,
        allowNull: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lang: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'bot_chats_tg'
});

TgChat.belongsTo(BotChat, {
    foreignKey: 'chatId',
    targetKey: 'id',
    as: 'serviceChat'
});

BotChat.hasOne(TgChat, {
    sourceKey: 'id',
    foreignKey: 'chatId'
});

export { TgChat };

