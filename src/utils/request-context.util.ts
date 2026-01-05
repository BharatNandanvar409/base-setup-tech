import { AsyncLocalStorage } from 'async_hooks';

export interface AuditEvent {
    table: string;
    operation: 'create' | 'update' | 'destroy';
    prev: any | null;
    next: any | null;
}

export interface RequestContext {
    requestId: string;
    auditEvents: AuditEvent[];
    actorId?: string | null;
}

export const requestAsyncStore = new AsyncLocalStorage<RequestContext>();

