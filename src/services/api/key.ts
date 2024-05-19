import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { config } from "../../../config";
import { sequelize } from "../../db";
import { ApiKey } from "../../key";
import { BotChat } from "../bots/chat";

const keyTool = new ApiKey(config.encrypt_key);

class ApiKeyModel extends Model<InferAttributes<ApiKeyModel>, InferCreationAttributes<ApiKeyModel>> {
    public static async fromKeyString(keyString: string): Promise<ApiKeyModel | null> {
        try {
            const { id, iv } = keyTool.parseKey(keyString);

            return this.findOne({ where: { id: Number(id), iv } });
        } catch (e) {
            return null;
        }
    }

    declare id: CreationOptional<number>;
    declare chatId: number;
    declare limitPerSec: CreationOptional<number>;
    declare iv: CreationOptional<Buffer>;
    declare lastUsed: Date | null;

    public async renewIV() {
        const iv = keyTool.createIV();

        this.iv = iv;

        await this.save();
    }

    public getApiKey() {
        return keyTool.getKey(this.id, this.iv);
    }
}

ApiKeyModel.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: true
    },
    chatId: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
    },
    limitPerSec: {
        type: DataTypes.SMALLINT,
        defaultValue: 2
    },
    iv: {
        type: DataTypes.BLOB,
        allowNull: false,
        defaultValue: () => {
            return keyTool.createIV();
        }
    },
    lastUsed: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'api',
    timestamps: true,
    indexes: []
});

ApiKeyModel.belongsTo(BotChat, {
    targetKey: 'id',
    foreignKey: 'chatId'
});

export { ApiKeyModel };

