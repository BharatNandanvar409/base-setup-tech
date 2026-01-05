import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    ForeignKey,
    BelongsTo,
    HasMany,
    AfterCreate,
    AfterUpdate,
    AfterDestroy
} from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';
import { Users } from './user.model';

export interface ILabel {
    id?: string;
    name: string;
    color: string;
    description?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

@Table({
    tableName: 'labels',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['name'],
        },
        {
            fields: ['createdBy'],
        }
    ]
})
export class Labels extends Model<ILabel> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        comment: 'Hex color code (e.g., #FF5733)'
    })
    declare color: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare description?: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare createdBy?: string;

    @BelongsTo(() => Users, 'createdBy')
    declare creator?: Users;

    @HasMany(() => require('./task-labels.model').TaskLabels)
    declare taskLabels?: any[];

    @CreatedAt
    declare createdAt?: Date;

    @UpdatedAt
    declare updatedAt?: Date;

    @DeletedAt
    declare deletedAt?: Date;

    @AfterCreate
    static afterCreateHook(instance: Labels) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'labels',
                operation: 'create',
                prev: null,
                next: instance.toJSON(),
            });
        }
    }

    @AfterUpdate
    static afterUpdateHook(instance: Labels) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'labels',
                operation: 'update',
                prev: (instance as any)._previousDataValues,
                next: instance.toJSON(),
            });
        }
    }

    @AfterDestroy
    static afterDestroyHook(instance: Labels) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            ctx.auditEvents.push({
                table: 'labels',
                operation: 'destroy',
                prev: instance.toJSON(),
                next: null,
            });
        }
    }
}
