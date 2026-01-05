import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { Orders } from './orders.model';
import { Products } from './products.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IOrderItem {
    id?: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
}

@Table({
    tableName: 'order_items',
    timestamps: true,
    paranoid: true,
    indexes: [],
})
export class OrderItems extends Model<IOrderItem> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @ForeignKey(() => Orders)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    orderId!: string;

    @ForeignKey(() => Products)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    productId!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    quantity!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    unitPrice!: number;

    @BelongsTo(() => Orders)
    order?: Orders;

    @BelongsTo(() => Products)
    product?: Products;

    @AfterCreate
    static afterCreateHook(instance: OrderItems) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'order_items',
                operation: 'create',
                prev: null,
                next: instance.toJSON(),
            });
        }
    }

    @AfterUpdate
    static afterUpdateHook(instance: OrderItems) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (instance as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({
                table: 'order_items',
                operation: 'update',
                prev,
                next: instance.toJSON(),
            });
        }
    }

    @AfterDestroy
    static afterDestroyHook(instance: OrderItems) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'order_items',
                operation: 'destroy',
                prev: instance.toJSON(),
                next: null,
            });
        }
    }
}

