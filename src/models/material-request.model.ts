import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum MaterialRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    IN_PURCHASE_REQ = 'in_purchase_req',
    RECEIVED_FROM_VENDOR = 'received_from_vendor',
    SEND_FOR_PICKUP = 'send_for_pickup',
    READY_FOR_PICKUP = 'ready_for_pickup',
    REJECTED = 'rejected',
    COMPLETED = 'completed'
}

export interface IMaterialRequest {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: MaterialRequestStatus;
}

@Table({
    tableName: 'material_requests',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class MaterialRequest extends Model<IMaterialRequest> {
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
        type: DataType.ENUM(...Object.values(MaterialRequestStatus)),
        allowNull: false,
        defaultValue: MaterialRequestStatus.PENDING,
    })
    status!: MaterialRequestStatus;

    @AfterCreate
    static ac(i: MaterialRequest) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'material_requests', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: MaterialRequest) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'material_requests', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: MaterialRequest) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'material_requests', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
