import { Column, DataType, Table, Model, HasMany, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { OrderItems } from './orderitems.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IOrder {
    id?: string;
    orderNumber: string;
    status: string;
    total: number;
}

@Table({
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['orderNumber'], unique: true }],
})
export class Orders extends Model<IOrder> {
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
    orderNumber!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    status!: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    total!: number;

    @HasMany(() => OrderItems)
    items?: OrderItems[];

    @AfterCreate
    static afterCreateHook(instance: Orders) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'orders',
                operation: 'create',
                prev: null,
                next: instance.toJSON(),
            });
        }
    }

    @AfterUpdate
    static afterUpdateHook(instance: Orders) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (instance as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({
                table: 'orders',
                operation: 'update',
                prev,
                next: instance.toJSON(),
            });
        }
    }

    @AfterDestroy
    static afterDestroyHook(instance: Orders) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'orders',
                operation: 'destroy',
                prev: instance.toJSON(),
                next: null,
            });
        }
    }
}
