import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum PackagingListStatus {
    PENDING = 'pending',
    PACKAGING = 'packaging',
    READY_TO_LOAD = 'ready_to_load',
    IN_TRANSIT = 'in_transit',
    UNPACKING = 'unpacking',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    MISSING = 'missing'
}

export interface IPackagingList {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
    startDate: Date;
    endDate?: Date;
    status: PackagingListStatus;
}

@Table({
    tableName: 'packaging_lists',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['assignedTo'] },
        { fields: ['startDate'] }
    ],
})
export class PackagingList extends Model<IPackagingList> {
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
        type: DataType.ENUM(...Object.values(PackagingListStatus)),
        allowNull: false,
        defaultValue: PackagingListStatus.PENDING,
    })
    status!: PackagingListStatus;

    @AfterCreate
    static ac(i: PackagingList) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'packaging_lists', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: PackagingList) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'packaging_lists', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: PackagingList) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'packaging_lists', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
