
import { Column, Model, DataType, Table, AfterCreate, AfterUpdate, AfterDestroy } from "sequelize-typescript";
import { requestAsyncStore } from "../utils/request-context.util";

export interface IProduct{
    id?: string;
    title: string;
    price: number;
    description?: string;
    category?: string;
    image?: string;
    productKey?: string;
    reSync?: boolean;
}
@Table({
    tableName: "products",
    timestamps: true,
    paranoid: true,
    indexes: [],
})

export class Products extends Model<IProduct> {
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
    title!: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    price!: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    description!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    category?: string;

    
    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    image?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    productKey?: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true,
    })
    reSync?: boolean;

    @AfterCreate
    static afterCreateHook(instance: Products) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'products',
                operation: 'create',
                prev: null,
                next: instance.toJSON(),
            });
        }
    }

    @AfterUpdate
    static afterUpdateHook(instance: Products) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (instance as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({
                table: 'products',
                operation: 'update',
                prev,
                next: instance.toJSON(),
            });
        }
    }

    @AfterDestroy
    static afterDestroyHook(instance: Products) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'products',
                operation: 'destroy',
                prev: instance.toJSON(),
                next: null,
            });
        }
    }
}
