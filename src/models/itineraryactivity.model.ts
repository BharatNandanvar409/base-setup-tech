import { Column, DataType, Table, Model, ForeignKey, BelongsTo, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { ItineraryDays } from './itineraryday.model';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IItineraryActivity {
    id?: string;
    dayId: string;
    title: string;
    timeStart?: string;
    timeEnd?: string;
    order?: number;
    notes?: string;
}

@Table({
    tableName: 'itinerary_activities',
    timestamps: true,
    paranoid: true,
})
export class ItineraryActivities extends Model<IItineraryActivity> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @ForeignKey(() => ItineraryDays)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    dayId!: string;

    @BelongsTo(() => ItineraryDays)
    day?: ItineraryDays;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    title!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    timeStart?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    timeEnd?: string;

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

    @AfterCreate
    static ac(i: ItineraryActivities) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'itinerary_activities', operation: 'create', prev: null, next: i.toJSON() });
    }
    @AfterUpdate
    static au(i: ItineraryActivities) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'itinerary_activities', operation: 'update', prev, next: i.toJSON() });
        }
    }
    @AfterDestroy
    static ad(i: ItineraryActivities) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'itinerary_activities', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
