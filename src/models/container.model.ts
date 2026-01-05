import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum ContainerStatus {
    PENDING = 'pending',
    READY_TO_LOAD = 'ready_to_load',
    TRANSIT = 'transit',
    ESTIMATED_ARRIVAL = 'estimated_arrival',
    AT_DOCK = 'at_dock',
    UNDER_CLEARANCE = 'under_clearance',
    WAITING_FOR_DELIVERY = 'waiting_for_delivery',
    ARRIVED_AT_LOCATION = 'arrived_at_location',
    CONTAINER_UNLOADING = 'container_unloading',
    UNLOADING_COMPLETED = 'unloading_completed',
    DELIVERED = 'delivered',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface IContainer {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: ContainerStatus;
}

@Table({
    tableName: 'containers',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class Container extends Model<IContainer> {
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
        type: DataType.ENUM(...Object.values(ContainerStatus)),
        allowNull: false,
        defaultValue: ContainerStatus.PENDING,
    })
    status!: ContainerStatus;

    @AfterCreate
    static ac(i: Container) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'containers', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: Container) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'containers', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: Container) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'containers', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
