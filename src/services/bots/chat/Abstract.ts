import { Model, Optional } from "sequelize";

export interface IAbstractServiceChatAttributes {
    id: number;
    chatId: number;
    peerId: any;
}

export type IAbstractServiceChatCreationAttributes = Optional<IAbstractServiceChatAttributes, 'id'>;

export abstract class AbstractServiceChat<
    TModelAttributes extends {} = IAbstractServiceChatAttributes,
    TCreationAttributes extends {} = IAbstractServiceChatCreationAttributes
> extends Model<TModelAttributes, TCreationAttributes> {
    declare id: number;
    declare chatId: number;
    declare peerId: any;

    public abstract isSuperAdmin(): boolean;
    // public abstract get isChat(): boolean;
}
