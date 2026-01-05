# Task Board Module

This module implements a staged procurement workflow (Kanban) across multiple entities and a unified task board. It supports creation, status transitions, automatic stage creation, label management, and audit history.

## Workflow

- Order: `material_request → purchase_request → purchase_quotes → purchase_order → proforma_invoice → container → packaging_list → commercial_invoice`
- Status enums are defined per entity and used as Kanban columns.
- Automatic next-stage entity creation occurs on `approved` or `completed` of a stage.

## Business Rules

- Material Request completion is gated by final stage completion:
  - A `material_request` cannot be moved to `completed` until the related `commercial_invoice` task is `completed`.
- Automatic next-stage creation:
  - When a task reaches `approved` or `completed`, an entity for the next stage is created using the same `title`, initial `pending` status, and copied labels.
- Cascading completion:
  - Previous broad cascading is removed. Only the `material_request` is auto-completed when the final stage (`commercial_invoice`) is completed.
- Labels:
  - Labels assigned to a task are copied to the auto-created next stage.

## Database Design

### Task Board

- Table: `task_board`
- Fields:
  - `id` `UUID` (PK)
  - `taskType` `ENUM` (one of the workflow stages)
  - `taskId` `UUID` (FK to the stage entity)
  - `currentState` `STRING` (optional)
  - `currentStatus` `STRING` (current enum value of the stage)
  - `assignedTo` `UUID` (FK `users.id`, optional)
- Relations:
  - `BelongsTo(Users)` via `assignedTo`
  - `HasMany(TaskStatusHistory)` via `id`

### Task Status History

- Table: `task_status_history`
- Fields:
  - `id` `UUID` (PK)
  - `taskId` `UUID` (FK to `task_board.id`)
  - `oldState` `STRING` (nullable)
  - `newState` `STRING` (nullable)
  - `oldStatus` `STRING` (nullable)
  - `newStatus` `STRING` (required)
  - `changedBy` `UUID` (FK `users.id`)
  - `changedAt` `TIMESTAMP`
- Purpose:
  - Complete audit trail of status transitions per task board card.

### Labels and Task Labels

- `labels`
  - `id` `UUID` (PK), `name`, `color`, `description`, `createdBy` (FK `users.id`), timestamps, soft delete
- `task_labels`
  - `id` `UUID` (PK)
  - `taskBoardId` `UUID` (FK `task_board.id`)
  - `labelId` `UUID` (FK `labels.id`)
  - `assignedBy` `UUID` (FK `users.id`, optional)
  - `assignedAt` `TIMESTAMP`
  - Unique constraint: (`taskBoardId`, `labelId`)

### Stage Entities

All stage entities share a common structure:

- `id` `UUID` (PK)
- `title` `STRING`
- `description` `TEXT` (optional)
- `assignedTo` `UUID` (FK `users.id`, optional)
- `startDate` `DATE`
- `endDate` `DATE` (optional)
- `status` `ENUM` per stage

Entities and their status enums:

- `material_requests` (`MaterialRequestStatus`): `pending`, `approved`, `in_purchase_req`, `received_from_vendor`, `send_for_pickup`, `ready_for_pickup`, `rejected`, `completed`
- `purchase_requests` (`PurchaseRequestStatus`): `pending`, `approved`, `in_procurement`, `rejected`, `completed`, `cancelled`
- `purchase_quotes` (`PurchaseQuotesStatus`): `pending`, `approved`, `rejected`, `completed`, `send_to_vendor`, `in_procurement`
- `purchase_orders` (`PurchaseOrderStatus`): `pending`, `approved`, `rejected`, `completed`, `cancelled`, `in_production`, `in_container`, `proforma_created`
- `proforma_invoices` (`ProformaInvoiceStatus`): `pending`, `approved`, `rejected`, `completed`, `cancelled`
- `containers` (`ContainerStatus`): `pending`, `ready_to_load`, `transit`, `estimated_arrival`, `at_dock`, `under_clearance`, `waiting_for_delivery`, `arrived_at_location`, `container_unloading`, `unloading_completed`, `delivered`, `completed`, `cancelled`
- `packaging_lists` (`PackagingListStatus`): `pending`, `packaging`, `ready_to_load`, `in_transit`, `unpacking`, `completed`, `cancelled`, `missing`
- `commercial_invoices` (`CommercialInvoiceStatus`): `pending`, `approved`, `rejected`, `completed`, `cancelled`

## Service API

- `createTask(data)`:
  - Creates stage entity and task board card, writes initial history.
- `updateTaskStatus(taskBoardIdOrEntityId, data)`:
  - Updates stage entity and task board status, writes history, auto-creates next stage.
  - Enforces material request completion gating.
- `dragDropStatusUpdate(taskBoardId, data)`:
  - Kanban drag-drop update; same rules and auto-create.
- `getAllTasks(query)`:
  - Paged list with populated stage entity.
- `getTaskById(id)`:
  - Returns task board card, stage entity, history, labels.
- `getKanbanBoard(taskType, labelIds?)`:
  - Builds Kanban board with labels per card.
- `getTaskAuditTrail(taskBoardId)`:
  - Returns per-task status history ordered by time.
- `getWorkflowAuditTrail(taskBoardId)`:
  - Aggregates history across the workflow chain by matching `title` per stage.

## Audit Logs UI

- The “info” button can call `getTaskAuditTrail` for the selected card.
- A workflow-level audit view can call `getWorkflowAuditTrail` to show movements across stages with actor and timestamps.

## Linking Across Stages

- Auto-created tasks reuse the same `title`, enabling cross-stage grouping.
- Manual tasks can adopt the same `title` to join the workflow chain.
- A dedicated `workflowId` can be added later for stronger linking if needed.

## Notes

- The module relies on Sequelize model hooks to push audit events into an async request context for centralized logging.
- Security: no secrets are logged; audit entries capture only necessary diffs and metadata.
