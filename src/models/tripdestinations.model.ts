import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { Trips } from './trip.model';
import { Destinations } from './destination.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface ITripDestination {
    id?: string;
    tripId: string;
    destinationId: string;
    order?: number;
    notes?: string;
}

@Table({
    tableName: 'trip_destinations',
    timestamps: true,
    paranoid: true,
})
export class TripDestinations extends Model<ITripDestination> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @ForeignKey(() => Trips)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    tripId!: string;

    @ForeignKey(() => Destinations)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    destinationId!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    order?: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes?: string;

    @BelongsTo(() => Trips)
    trip?: Trips;

    @BelongsTo(() => Destinations)
    destination?: Destinations;

    @AfterCreate
    static ac(i: TripDestinations) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'trip_destinations', operation: 'create', prev: null, next: i.toJSON() });
    }
    @AfterUpdate
    static au(i: TripDestinations) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prev = (i as any)._previousDataValues || null;
            ctx.auditEvents.push({ table: 'trip_destinations', operation: 'update', prev, next: i.toJSON() });
        }
    }
    @AfterDestroy
    static ad(i: TripDestinations) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'trip_destinations', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}

