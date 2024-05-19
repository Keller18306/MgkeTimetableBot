import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../../../db";

// TODO new lessons db
class Lesson extends Model<InferAttributes<Lesson>, InferCreationAttributes<Lesson>> {
    declare id: CreationOptional<number>;
    declare dayIndex: number;
    declare lessonIndex: number;
    declare group: string;
    declare subgroup: number | null;
    declare teacher: string;
    declare lesson: string;
    declare type: string | null;
    declare cabinet: string | null;
    declare comment: string | null;
}

Lesson.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    dayIndex: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    lessonIndex: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    group: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subgroup: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    teacher: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lesson: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cabinet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comment: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'timetable',
    indexes: [
        {
            fields: ['dayIndex']
        },
        {
            fields: ['dayIndex', 'lessonIndex', 'group', 'subgroup'],
            unique: true
        },
        {
            fields: ['dayIndex', 'lessonIndex', 'teacher'],
            unique: true
        },
        {
            fields: ['group']
        },
        {
            fields: ['teacher']
        }
    ]
});