
import { Column, Model, DataType, Table, BelongsTo } from "sequelize-typescript";

export interface IUser{
    id?: string;
    username: string;
    email: string;
    password: string;
    token?: string
}
@Table({
    tableName: "users",
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ["email"],
            unique: true,
        },
        {
            fields: ["username"],
            unique: true,
        },
    ],
})

export class Users extends Model<IUser> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    username!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    password!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    token?: string;
}