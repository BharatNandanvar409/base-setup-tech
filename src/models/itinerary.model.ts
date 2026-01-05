import { Column, DataType, Table, Model, ForeignKey, BelongsTo, HasMany, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { Trips } from './trip.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IItinerary {
    id?: string;
    tripId: string;
    revision: number;
    notes?: string;
}

@Table({
    tableName: 'itineraries',
    timestamps: true,
    paranoid: true,
})
export class Itineraries extends Model<IItinerary> {
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

    @BelongsTo(() => Trips)
    trip?: Trips;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1,
    })
    revision!: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes?: string;

    @AfterCreate
    static ac(i: Itineraries) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'itineraries', operation: 'create', prev: null, next: i.toJSON() });
    }
    @AfterUpdate
    static au(i: Itineraries) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prev = (i as any)._previousDataValues || null;
            ctx.auditEvents.push({ table: 'itineraries', operation: 'update', prev, next: i.toJSON() });
        }
    }
    @AfterDestroy
    static ad(i: Itineraries) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'itineraries', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
