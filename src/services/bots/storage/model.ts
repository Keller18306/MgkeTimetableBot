import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../../../db";

class StorageModel extends Model<InferAttributes<StorageModel>, InferCreationAttributes<StorageModel>> {
    declare storage: string;
    declare key: string;
    declare value: string;

    declare expiresAt: Date | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

StorageModel.init({
    storage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
}, {
    sequelize: sequelize,
    tableName: 'storage',
    indexes: [
        {
            fields: ['storage']
        },
        {
            fields: ['key']
        },
        {
            fields: ['storage', 'key'],
            unique: true
        }
    ]
});

export { StorageModel }