export interface IEntityTarget {
    model: string;
    ids: (string | number)[];
    include?: any[];
}

export interface IAuditPayload {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    success: boolean;
    durationMs: number;
    actorId?: string | null;
    prev_data: Record<string, any[]>;
    update_data: Record<string, any[]>;
    updated_fields: Record<string, string[]>;
    timestamp: Date;
}
