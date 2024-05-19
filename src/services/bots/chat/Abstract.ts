import { Model } from "sequelize";

export abstract class AbstractServiceChat<TModelAttributes extends {} = any, TCreationAttributes extends {} = any> extends Model<TModelAttributes, TCreationAttributes> {
    declare chatId: number;
    declare peerId: any;

    public abstract isSuperAdmin(): boolean;
    // public abstract get isChat(): boolean;
}
