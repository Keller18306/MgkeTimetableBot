import {
    CreationOptional, DataTypes, InferAttributes,
    InferCreationAttributes, Model
} from 'sequelize';
import { sequelize } from '../../../db';

export type AliasRecords = Record<string, string>;

class LessonAlias extends Model<InferAttributes<LessonAlias>, InferCreationAttributes<LessonAlias>> {
    declare id: CreationOptional<number>;
    declare chatId: number;
    declare lesson: string;
    declare alias: string;
}

LessonAlias.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chatId: {
        type: DataTypes.INTEGER
    },
    lesson: {
        type: DataTypes.STRING
    },
    alias: {
        type: DataTypes.STRING
    }
}, {
    sequelize: sequelize,
    tableName: 'bot_aliases',
    indexes: [
        {
            fields: ['chatId']
        },
        {
            fields: ['chatId', 'lesson'],
            unique: true
        }
    ]
});

export { LessonAlias };