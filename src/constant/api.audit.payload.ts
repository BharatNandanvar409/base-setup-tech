export interface IAuditPayload {
    // Context
    requestId: string;
    method: string;
    path: string;
    actorId?: string | null;
    statusCode?: number; // Can be added if we intercept response finish

    // The Data
    prev_data: {
        [tableName: string]: any[]; // Array of records
    };
    updated_data: {
        [tableName: string]: any[]; // Array of records
    };

    timestamp: Date;
}