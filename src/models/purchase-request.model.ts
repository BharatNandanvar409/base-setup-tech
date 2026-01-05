import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum PurchaseRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    IN_PROCUREMENT = 'in_procurement',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface IPurchaseRequest {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: PurchaseRequestStatus;
}

@Table({
    tableName: 'purchase_requests',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class PurchaseRequest extends Model<IPurchaseRequest> {
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
        type: DataType.ENUM(...Object.values(PurchaseRequestStatus)),
        allowNull: false,
        defaultValue: PurchaseRequestStatus.PENDING,
    })
    status!: PurchaseRequestStatus;

    @AfterCreate
    static ac(i: PurchaseRequest) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'purchase_requests', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: PurchaseRequest) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'purchase_requests', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: PurchaseRequest) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'purchase_requests', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
