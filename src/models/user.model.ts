
import { Column, Model, DataType, Table, AfterCreate, AfterUpdate, AfterDestroy } from "sequelize-typescript";
import { requestAsyncStore } from "../utils/request-context.util";

export interface IUser{
    id?: string;
    username: string;
    email: string;
    password: string;
    token?: string
    role?: 'user' | 'admin',
    fcmToken?: string,
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

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: 'user',
    })
    role?: 'user' | 'admin';

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    fcmToken?: string;

    @AfterCreate
    static afterCreateHook(instance: Users) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'users',
                operation: 'create',
                prev: null,
                next: instance.toJSON(),
            });
        }
    }

    @AfterUpdate
    static afterUpdateHook(instance: Users) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (instance as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({
                table: 'users',
                operation: 'update',
                prev,
                next: instance.toJSON(),
            });
        }
    }

    @AfterDestroy
    static afterDestroyHook(instance: Users) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'users',
                operation: 'destroy',
                prev: instance.toJSON(),
                next: null,
            });
        }
    }

}
