import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { config } from "../../../config";
import { sequelize } from "../../db";

class VKAppUser extends Model<InferAttributes<VKAppUser>, InferCreationAttributes<VKAppUser>> {
    public static async getOrCreateByUserId(userId: number): Promise<VKAppUser | null> {
        return this.findOrCreate({
            defaults: { userId },
            where: { userId }
        }).then(res => res[0]);
    }

    declare id: CreationOptional<number>
    declare userId: number
    declare accepted: CreationOptional<boolean>
    declare ref: string | null
    declare group: string | null
    declare teacher: string | null
    declare themeId: CreationOptional<number>
    declare adblock: CreationOptional<boolean>
    declare firstPage: string | null
    declare loginAt: CreationOptional<Date>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

VKAppUser.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        unique: true
    },
    accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: config.accept.app
    },
    ref: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true
    },
    teacher: {
        type: DataTypes.STRING,
        allowNull: true
    },
    themeId: {
        type: DataTypes.INTEGER
    },
    adblock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    firstPage: {
        type: DataTypes.STRING,
        allowNull: true
    }, 
    loginAt: {
        type: DataTypes.DATE,
        defaultValue: () => {
            return new Date();
        }
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
}, {
    sequelize: sequelize,
    tableName: 'vk_app_users',
    timestamps: true
});

export { VKAppUser };