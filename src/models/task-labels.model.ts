import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    BelongsTo,
    AfterCreate,
    AfterUpdate,
    AfterDestroy
} from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { TaskBoard } from './task-board.model';
import { Labels } from './labels.model';
import { Users } from './user.model';

export interface ITaskLabels {
    id?: string;
    taskBoardId: string;
    labelId: string;
    assignedBy?: string;
    assignedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

@Table({
    tableName: 'task_labels',
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            fields: ['taskBoardId'],
        },
        {
            fields: ['labelId'],
        },
        {
            unique: true,
            fields: ['taskBoardId', 'labelId'],
            name: 'unique_task_label'
        }
    ]
})
export class TaskLabels extends Model<ITaskLabels> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id?: string;

    @ForeignKey(() => TaskBoard)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare taskBoardId: string;

    @BelongsTo(() => TaskBoard)
    declare taskBoard?: TaskBoard;

    @ForeignKey(() => Labels)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare labelId: string;

    @BelongsTo(() => Labels)
    declare label?: Labels;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare assignedBy?: string;

    @BelongsTo(() => Users, 'assignedBy')
    declare assigner?: Users;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare assignedAt?: Date;

    @CreatedAt
    declare createdAt?: Date;

    @UpdatedAt
    declare updatedAt?: Date;

    @AfterCreate
    static afterCreateHook(instance: TaskLabels) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'task_labels',
                operation: 'create',
                prev: null,
                next: instance.toJSON(),
            });
        }
    }

    @AfterUpdate
    static afterUpdateHook(instance: TaskLabels) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'task_labels',
                operation: 'update',
                prev: (instance as any)._previousDataValues,
                next: instance.toJSON(),
            });
        }
    }

    @AfterDestroy
    static afterDestroyHook(instance: TaskLabels) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'task_labels',
                operation: 'destroy',
                prev: instance.toJSON(),
                next: null,
            });
        }
    }
}
