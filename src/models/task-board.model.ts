import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy, HasMany } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export enum TaskType {
    MATERIAL_REQUEST = 'material_request',
    PURCHASE_REQUEST = 'purchase_request',
    PURCHASE_QUOTES = 'purchase_quotes',
    PURCHASE_ORDER = 'purchase_order',
    PROFORMA_INVOICE = 'proforma_invoice',
    CONTAINER = 'container',
    PACKAGING_LIST = 'packaging_list',
    COMMERCIAL_INVOICE = 'commercial_invoice'
}

export interface ITaskBoard {
    id?: string;
    taskType: TaskType;
    taskId: string;
    currentState?: string;
    currentStatus: string;
    assignedTo?: string;
}

@Table({
    tableName: 'task_board',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['taskType'] },
        { fields: ['taskId'] },
        { fields: ['currentStatus'] },
        { fields: ['assignedTo'] }
    ],
})
export class TaskBoard extends Model<ITaskBoard> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @Column({
        type: DataType.ENUM(...Object.values(TaskType)),
        allowNull: false,
    })
    taskType!: TaskType;

    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    taskId!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    currentState?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    currentStatus!: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    assignedTo?: string;

    @BelongsTo(() => Users)
    assignedUser?: Users;

    @HasMany(() => require('./task-status-history.model').TaskStatusHistory)
    statusHistory?: any[];

    @AfterCreate
    static ac(i: TaskBoard) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'task_board', operation: 'create', prev: null, next: i.toJSON() });
    }

    @AfterUpdate
    static au(i: TaskBoard) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'task_board', operation: 'update', prev, next: i.toJSON() });
        }
    }

    @AfterDestroy
    static ad(i: TaskBoard) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'task_board', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
