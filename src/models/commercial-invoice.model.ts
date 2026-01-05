import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum CommercialInvoiceStatus {
    PENDING = 'pending',
    AT_DOCK = 'at_dock',
    READY_TO_LOAD = 'ready_to_load',
    IN_CONTAINER = 'in_container',
    IN_TRANSIT = 'in_transit',
    UNDER_CLEARANCE = 'under_clearance',
    WAITING_FOR_DELIVERY = 'waiting_for_delivery',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    ESTIMATED_ARRIVAL = 'estimated_arrival',
    ARRIVED_AT_LOCATION = 'arrived_at_location'
}

export interface ICommercialInvoice {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: CommercialInvoiceStatus;
}

@Table({
    tableName: 'commercial_invoices',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class CommercialInvoice extends Model<ICommercialInvoice> {
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
        type: DataType.ENUM(...Object.values(CommercialInvoiceStatus)),
        allowNull: false,
        defaultValue: CommercialInvoiceStatus.PENDING,
    })
    status!: CommercialInvoiceStatus;

    @AfterCreate
    static ac(i: CommercialInvoice) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'commercial_invoices', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: CommercialInvoice) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'commercial_invoices', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: CommercialInvoice) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'commercial_invoices', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
