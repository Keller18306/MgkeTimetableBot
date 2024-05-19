import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../../../db";

class TimetableArchive extends Model<InferAttributes<TimetableArchive>, InferCreationAttributes<TimetableArchive>> {
    declare id: CreationOptional<number>;
    declare day: number;
    declare group: string | null;
    declare teacher: string | null;
    declare data: string;
}

TimetableArchive.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    day: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true
    },
    teacher: {
        type: DataTypes.STRING,
        allowNull: true
    },
    data: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    sequelize: sequelize,
    tableName: 'timetable_archive',
    indexes: [
        {
            fields: ['day', 'group'],
            unique: true
        },
        {
            fields: ['day', 'teacher'],
            unique: true
        }
    ]
});

export { TimetableArchive };