import { Credentials } from 'google-auth-library';
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from "../../../db";
import { GoogleUserApi } from "../api";
import { BotChat } from '../../bots/chat';

class GoogleUser extends Model<InferAttributes<GoogleUser>, InferCreationAttributes<GoogleUser>> {
    public static async getByEmail(email: string): Promise<GoogleUser> {
        return this.findOne({
            where: { email },
            rejectOnEmpty: true
        });
    }

    public static async createByEmail(email: string, credentials: Credentials): Promise<GoogleUser> {
        return this.upsert({
            email: email,
            refreshToken: credentials.refresh_token ?? undefined,
            accessToken: credentials.access_token ?? undefined,
            accessTokenExpires: credentials.expiry_date ?? undefined
        }).then(res => res[0]);
        // return this.findOrCreate({
        //     defaults: ,
        //     where: { email },

        // }).then(res => res[0]);
    }

    declare id: CreationOptional<number>;
    declare email: string;
    declare refreshToken: string | null;
    declare accessToken: string | null;
    declare accessTokenExpires: number | null;

    private _api?: GoogleUserApi;

    public getApi() {
        if (!this._api) {
            this._api = new GoogleUserApi({
                refresh_token: this.refreshToken,
                access_token: this.accessToken,
                expiry_date: this.accessTokenExpires
            }, this.updateCredentials.bind(this));
        }

        return this._api;
    }

    private async updateCredentials(credentials: Credentials) {
        this.refreshToken = credentials.refresh_token ?? this.refreshToken ?? null;
        this.accessToken = credentials.access_token ?? null;
        this.accessTokenExpires = credentials.expiry_date ?? null;

        await this.save();
    }
}

GoogleUser.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
            isEmail: true
        },
        allowNull: false
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    accessTokenExpires: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize: sequelize,
    tableName: 'google_accounts'
});

// GoogleUser.belongsTo(BotChat, {
//     foreignKey: 'email',
//     targetKey: 'googleEmail'
// });

BotChat.belongsTo(GoogleUser, {
    targetKey: 'email',
    foreignKey: 'googleEmail'
});

export { GoogleUser };
