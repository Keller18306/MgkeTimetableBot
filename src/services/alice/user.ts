import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../../db";

class AliceUser extends Model<InferAttributes<AliceUser>, InferCreationAttributes<AliceUser>> {
    public static async getById(userId: string): Promise<AliceUser> {
        return this.findOrCreate({
            defaults: { userId },
            where: { userId }
        }).then(res => res[0]);
    }

    declare id: CreationOptional<string>;
    declare userId: string;
    declare mode: 'teacher' | 'group' | null;
    declare group: string | null;
    declare teacher: string | null;
}

AliceUser.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING,
        unique: true
    },
    mode: {
        type: DataTypes.ENUM('teacher', 'group'),
        allowNull: true
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true
    },
    teacher: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'alice_users',
    timestamps: true
});

export { AliceUser };
