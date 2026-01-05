import { Column, DataType, Table, Model, Index, AfterCreate, AfterUpdate, AfterDestroy } from 'sequelize-typescript';
import { requestAsyncStore } from '../utils/request-context.util';

export interface IDestination {
    id?: string;
    country: string;
    city: string;
    bestTimeToVisit?: string;
    avgCost?: number;
    activities?: string[];
    safetyScore?: number;
    orderIndex?: number;
    metadata?: Record<string, any>;
}

@Table({
    tableName: 'destinations',
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['country', 'city'] }, { fields: ['orderIndex'] }],
})
export class Destinations extends Model<IDestination> {
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    country!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    city!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    bestTimeToVisit?: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    avgCost?: number;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: [],
    })
    activities?: string[];

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    safetyScore?: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    orderIndex?: number;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: {},
    })
    metadata?: Record<string, any>;

    @AfterCreate
    static ac(i: Destinations) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'destinations', operation: 'create', prev: null, next: i.toJSON() });
    }
    @AfterUpdate
    static au(i: Destinations) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) {
            const prevRaw = (i as any)._previousDataValues || null;
            const prev = prevRaw ? JSON.parse(JSON.stringify(prevRaw)) : null;
            ctx.auditEvents.push({ table: 'destinations', operation: 'update', prev, next: i.toJSON() });
        }
    }
    @AfterDestroy
    static ad(i: Destinations) {
        const ctx = requestAsyncStore.getStore();
        if (ctx) ctx.auditEvents.push({ table: 'destinations', operation: 'destroy', prev: i.toJSON(), next: null });
    }
}
