import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum PurchaseQuotesStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
    SEND_TO_VENDOR = 'send_to_vendor',
    IN_PROCUREMENT = 'in_procurement'
}

export interface IPurchaseQuotes {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: PurchaseQuotesStatus;
}

@Table({
    tableName: 'purchase_quotes',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class PurchaseQuotes extends Model<IPurchaseQuotes> {
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
        type: DataType.TEXT,
        allowNull: true,
    })
    description?: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    assignedTo?: string;

    @BelongsTo(() => Users)
    assignedUser?: Users;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    startDate!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    endDate?: Date;

    @Column({
        type: DataType.ENUM(...Object.values(PurchaseQuotesStatus)),
        allowNull: false,
        defaultValue: PurchaseQuotesStatus.PENDING,
    })
    status!: PurchaseQuotesStatus;

    @AfterCreate
    static ac(i: PurchaseQuotes) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'purchase_quotes', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: PurchaseQuotes) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'purchase_quotes', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: PurchaseQuotes) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'purchase_quotes', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
