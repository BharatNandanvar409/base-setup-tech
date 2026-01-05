import { Column, DataType, Table, Model, ForeignKey, BelongsTo, HasMany, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { Itineraries } from './itinerary.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IItineraryDay {
    id?: string;
    itineraryId: string;
    dayIndex: number;
    date?: Date;
    notes?: string;
}

@Table({
    tableName: 'itinerary_days',
    timestamps: true,
    paranoid: true,
})
export class ItineraryDays extends Model<IItineraryDay> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @ForeignKey(() => Itineraries)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    itineraryId!: string;

    @BelongsTo(() => Itineraries)
    itinerary?: Itineraries;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    dayIndex!: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    date?: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes?: string;

    @AfterCreate
    static ac(i: ItineraryDays) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'itinerary_days', operation: 'create', prev: null, next: i.toJSON() });
    }
    @AfterUpdate
    static au(i: ItineraryDays) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prev = (i as any)._previousDataValues || null;
            ctx.auditEvents.push({ table: 'itinerary_days', operation: 'update', prev, next: i.toJSON() });
        }
    }
    @AfterDestroy
    static ad(i: ItineraryDays) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'itinerary_days', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}

