import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum ProformaInvoiceStatus {
    PENDING = 'pending',
    PROCESSING_PAYMENT = 'processing_payment',
    READY_TO_LOAD = 'ready_to_load',
    IN_CONTAINER = 'in_container',
    IN_TRANSIT = 'in_transit',
    PENDING_DOCUMENTATION = 'pending_documentation',
    GATE_PASS = 'gate_pass',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    ESTIMATED_ARRIVAL = 'estimated_arrival'
}

export interface IProformaInvoice {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: ProformaInvoiceStatus;
}

@Table({
    tableName: 'proforma_invoices',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class ProformaInvoice extends Model<IProformaInvoice> {
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
        type: DataType.ENUM(...Object.values(ProformaInvoiceStatus)),
        allowNull: false,
        defaultValue: ProformaInvoiceStatus.PENDING,
    })
    status!: ProformaInvoiceStatus;

    @AfterCreate
    static ac(i: ProformaInvoice) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'proforma_invoices', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: ProformaInvoice) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'proforma_invoices', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: ProformaInvoice) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'proforma_invoices', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
