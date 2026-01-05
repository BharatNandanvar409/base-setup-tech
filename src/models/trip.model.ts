import { Column, DataType, Table, Model, ForeignKey, BelongsTo, HasMany, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { Users } from './user.model';
import { Destinations } from './destination.model';
import { requestAsyncStore } from '../utils/request-context.util';
import { TripDestinations } from './tripdestinations.model';

export interface ITrip {
    id?: string;
    userId: string;
    status: 'planned' | 'ongoing' | 'completed';
    startDate: Date;
    endDate: Date;
    durationDays?: number;
    notes?: string;
    companions?: string[];
}

@Table({
    tableName: 'trips',
    timestamps: true,
    paranoid: true,
})
export class Trips extends Model<ITrip> {
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
        type: DataType.STRING,
        allowNull: false,
        defaultValue: 'planned',
    })
    status!: 'planned' | 'ongoing' | 'completed';

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    startDate!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    endDate!: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    durationDays?: number;

    @HasMany(() => TripDestinations)
    tripDestinations?: TripDestinations[];

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes?: string;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: [],
    })
    companions?: string[];

    @AfterCreate
    static ac(i: Trips) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'trips', operation: 'create', prev: null, next: i.toJSON() });
    }
    @AfterUpdate
    static au(i: Trips) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prev = (i as any)._previousDataValues || null;
            ctx.auditEvents.push({ table: 'trips', operation: 'update', prev, next: i.toJSON() });
        }
    }
    @AfterDestroy
    static ad(i: Trips) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'trips', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}

