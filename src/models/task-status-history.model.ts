import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';
import { TaskBoard } from './task-board.model';

export interface ITaskStatusHistory {
    id?: string;
    taskId: string;
    oldState?: string;
    newState?: string;
    oldStatus?: string;
    newStatus: string;
    changedBy: string;
    changedAt: Date;
}

@Table({
    tableName: 'task_status_history',
    timestamps: false,
    indexes: [
        { fields: ['taskId'] },
        { fields: ['changedBy'] },
        { fields: ['changedAt'] }
    ],
})
export class TaskStatusHistory extends Model<ITaskStatusHistory> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @ForeignKey(() => TaskBoard)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    taskId!: string;

    @BelongsTo(() => TaskBoard)
    task?: TaskBoard;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    oldState?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    newState?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    oldStatus?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    newStatus!: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    changedBy!: string;

    @BelongsTo(() => Users, 'changedBy')
    changedByUser?: Users;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    changedAt!: Date;

    @AfterCreate
    static ac(i: TaskStatusHistory) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'task_status_history', operation: 'create', prev: null, next: i.toJSON() });
    }
}
