import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { Users } from './user.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IUserPreferences {
    id?: string;
    userId: string;
    budgetMin?: number;
    budgetMax?: number;
    travelType?: 'solo' | 'couple' | 'family';
    preferredDestinations?: string[];
    foodInterests?: string[];
    activityInterests?: string[];
}

@Table({
    tableName: 'user_preferences',
    timestamps: true,
    paranoid: true,
})
export class UserPreferences extends Model<IUserPreferences> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    userId!: string;

    @BelongsTo(() => Users)
    user?: Users;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    budgetMin?: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    budgetMax?: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    travelType?: 'solo' | 'couple' | 'family';

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: [],
    })
    preferredDestinations?: string[];

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: [],
    })
    foodInterests?: string[];

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: [],
    })
    activityInterests?: string[];

    @AfterCreate
    static auditAfterCreate(instance: UserPreferences) {
        const ctx = requestAsyncStore.getStore();
        if (!ctx) return;

        ctx.auditEvents.push({
            table: 'user_preferences',
            operation: 'create',
            prev: null,
            next: instance.toJSON(),
        });
    }

    @AfterUpdate
    static auditAfterUpdate(instance: UserPreferences) {
        const ctx = requestAsyncStore.getStore();
        if (!ctx) return;

        const prevRaw = (instance as any)._previousDataValues || null;
        const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
        ctx.auditEvents.push({
            table: 'user_preferences',
            operation: 'update',
            prev,
            next: instance.toJSON(),
        });
    }

    @AfterDestroy
    static auditAfterDestroy(instance: UserPreferences) {
        const ctx = requestAsyncStore.getStore();
        if (!ctx) return;

        ctx.auditEvents.push({
            table: 'user_preferences',
            operation: 'destroy',
            prev: instance.toJSON(),
            next: null,
        });
    }
}
