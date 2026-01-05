import { Column, DataType, Table, Model, Index } from 'sequelize-typescript';

export interface IAuditLog {
    id?: string;
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    success: boolean;
    durationMs: number;
    actorId?: string | null;
    prev_data: Record<string, any>;
    update_data: Record<string, any>;
    updated_fields: Record<string, string[]>;
}

@Table({
    tableName: 'api_audit_logs',
    timestamps: true,
    paranoid: false,
    indexes: [
        { fields: ['requestId'] },
        { fields: ['path', 'method'] },
        { fields: ['statusCode'] },
        { fields: ['createdAt'] },
    ],
})
export class AuditLog extends Model<IAuditLog> {
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
    requestId!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    method!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    path!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    statusCode!: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    success!: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    durationMs!: number;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    actorId?: string | null;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    })
    prev_data!: Record<string, any>;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    })
    update_data!: Record<string, any>;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    })
    updated_fields!: Record<string, string[]>;
}
