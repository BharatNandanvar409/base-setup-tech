# Procurement Task Board API Documentation

## Overview

This API manages a procurement workflow system with 8 stages and automatic task progression. Tasks can be created at any stage, and approving a task automatically creates the next stage task.

**Base URL:** `http://localhost:5001`

**Authentication:** All endpoints require Bearer token authentication
Authorization: Bearer <your-token>

---

## Workflow Stages

Tasks progress through these stages in order:

1. **Material Request** → 2. **Purchase Request** → 3. **Purchase Quotes** → 4. **Purchase Order** → 5. **Proforma Invoice** → 6. **Container** → 7. **Packaging List** → 8. **Commercial Invoice**

### Task Types (for API calls)
- `material_request`
- `purchase_request`
- `purchase_quotes`
- `purchase_order`
- `proforma_invoice`
- `container`
- `packaging_list`
- `commercial_invoice`

---

## Status Enums by Task Type

### Material Request
`pending`, `approved`, `in_purchase_req`, `received_from_vendor`, `send_for_pickup`, `ready_for_pickup`, `rejected`, `completed`

### Purchase Request
`pending`, `approved`, `in_procurement`, `rejected`, `completed`, `cancelled`

### Purchase Quotes
`pending`, `approved`, `rejected`, `completed`, `send_to_vendor`, `in_procurement`

### Purchase Order
`pending`, `approved`, `rejected`, `completed`, `cancelled`, `in_production`, `in_container`, `proforma_created`

### Proforma Invoice
`pending`, `processing_payment`, `ready_to_load`, `in_container`, `in_transit`, `pending_documentation`, `gate_pass`, `completed`, `cancelled`, `estimated_arrival`

### Container
`pending`, `ready_to_load`, `transit`, `estimated_arrival`, `at_dock`, `under_clearance`, `waiting_for_delivery`, `arrived_at_location`, `container_unloading`, `unloading_completed`, `delivered`, `completed`, `cancelled`

### Packaging List
`pending`, `packaging`, `ready_to_load`, `in_transit`, `unpacking`, `completed`, `cancelled`, `missing`

### Commercial Invoice
`pending`, `at_dock`, `ready_to_load`, `in_container`, `in_transit`, `under_clearance`, `waiting_for_delivery`, `completed`, `cancelled`, `estimated_arrival`, `arrived_at_location`

---

## API Endpoints

### 1. Create Task

**POST** `/task-board`

Create a new task at any workflow stage.

**Request Body:**
```json
{
  "taskType": "purchase_order",
  "title": "Order Raw Materials",
  "description": "Order 1000 units of steel",
  "assignedTo": "user-uuid",
  "startDate": "2025-12-17",
  "endDate": "2025-12-31",
  "currentStatus": "pending",
  "currentState": "draft"
}
```

**Required Fields:**
- `taskType` (string) - One of the task types listed above
- `title` (string)
- `startDate` (date)
- `currentStatus` (string) - Must be valid for the task type

**Optional Fields:**
- `description` (string)
- `assignedTo` (UUID)
- `endDate` (date)
- `currentState` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "taskBoard": { "id": "...", "taskType": "...", ... },
    "procurementEntity": { "id": "...", "title": "...", ... }
  },
  "statusCode": 201,
  "message": "Task created successfully"
}
```

---

### 2. Update Task Status

**PATCH** `/task-board/:id/status`

Update task status with automatic next-stage creation and cascading completion.

**Request Body:**
```json
{
  "newStatus": "approved",
  "newState": "final",
  "changedBy": "user-uuid"
}
```

**Required Fields:**
- `newStatus` (string) - Must be valid for the task type
- `changedBy` (UUID)

**Optional Fields:**
- `newState` (string)

**Automatic Behaviors:**
- ✅ When status is `approved`: Creates next stage task automatically
- ✅ When status is `completed`: Marks all previous stages as completed
- ⚠️ Material Request approval requires all status steps to be completed first

**Response:**
```json
{
  "success": true,
  "data": {
    "taskBoard": { ... },
    "statusHistory": [ ... ]
  },
  "statusCode": 200,
  "message": "Task status updated successfully"
}
```

---

### 3. Drag & Drop Status Update

**PATCH** `/task-board/:id/drag-drop`

Simplified status update for drag-and-drop UI (no state parameter).

**Request Body:**
```json
{
  "newStatus": "approved",
  "changedBy": "user-uuid"
}
```

**Required Fields:**
- `newStatus` (string) - Must be valid for the task type
- `changedBy` (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "taskBoard": { ... },
    "message": "Task moved from 'pending' to 'approved'"
  },
  "statusCode": 200
}
```

---

### 4. Get Kanban Board

**GET** `/task-board/kanban/:taskType`

Get all tasks for a specific type grouped by status (perfect for Kanban UI).

**Example:** `GET /task-board/kanban/material_request`

**Response:**
```json
{
  "success": true,
  "data": {
    "taskType": "material_request",
    "statuses": ["pending", "approved", "in_purchase_req", ...],
    "board": {
      "pending": [
        {
          "taskBoard": { "id": "...", "title": "...", "currentStatus": "pending" },
          "procurementEntity": { "id": "...", "status": "pending", ... }
        }
      ],
      "approved": [],
      "in_purchase_req": [ ... ]
    },
    "totalTasks": 15
  },
  "statusCode": 200
}
```

**UI Implementation:**
- Use `statuses` array to create columns
- Use `board[status]` to populate each column with tasks
- Empty arrays mean no tasks in that status

---

### 5. List All Tasks

**GET** `/task-board`

Get paginated list of tasks with optional filtering.

**Query Parameters:**
- `taskType` (optional) - Filter by task type
- `assignedTo` (optional) - Filter by user UUID
- `currentStatus` (optional) - Filter by status
- `page` (optional, default: 1)
- `limit` (optional, default: 10, max: 100)

**Example:** `GET /task-board?taskType=purchase_order&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 45,
  "totalPages": 3,
  "page": 1,
  "limit": 20,
  "statusCode": 200
}
```

---

### 6. Get Task Details

**GET** `/task-board/:id`

Get complete task details including status history.

**Response:**
```json
{
  "success": true,
  "data": {
    "taskBoard": { "id": "...", "taskType": "...", ... },
    "procurementEntity": { "id": "...", "title": "...", ... },
    "history": [
      {
        "id": "...",
        "oldStatus": "pending",
        "newStatus": "approved",
        "changedBy": "user-uuid",
        "changedAt": "2025-12-17T10:30:00Z"
      }
    ]
  },
  "statusCode": 200
}
```

---

## Workflow Rules

### Automatic Task Creation
When a task is marked as **`approved`**, a new task is automatically created in the next workflow stage:

- Material Request (approved) → Creates Purchase Request
- Purchase Request (approved) → Creates Purchase Quotes
- Purchase Quotes (approved) → Creates Purchase Order
- Purchase Order (approved) → Creates Proforma Invoice
- Etc.

**Auto-created task properties:**
- Title: `"{original title} - Next Stage"`
- Description: `"Auto-created from {task_type}: {original title}"`
- Status: `pending`
- Assigned to: Same user as original task
- State: `auto-created`

### Cascading Completion
When a task is marked as **`completed`**, all previous workflow stages are automatically marked as completed.

### Material Request Validation
Material Request can only be approved if the task has gone through these statuses:
1. `pending`
2. `in_purchase_req`
3. `received_from_vendor`
4. `send_for_pickup`
5. `ready_for_pickup`

If any status is missing, the API returns an error with the missing statuses.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400/404/500,
  "status": "Error"
}
```

**Common Errors:**
- `400` - Invalid request body or missing required fields
- `401` - Unauthorized (missing or invalid token)
- `404` - Task not found
- `500` - Server error

---

## Frontend Implementation Guide

### Building a Kanban Board

1. **Fetch board data:**

   GET /task-board/kanban/material_request

2. **Create columns:**

   response.data.statuses.forEach(status => {
     createColumn(status, response.data.board[status])
   })

3. **Handle drag & drop:**

   onDrop(taskId, newStatus) {
     PATCH /task-board/${taskId}/drag-drop
     body: { newStatus, changedBy: currentUserId }
   }

### Creating a Task

POST /task-board
body: {
  taskType: 'purchase_order',
  title: 'Order Components',
  currentStatus: 'pending',
  assignedTo: currentUserId,
  startDate: new Date().toISOString()
}


### Displaying Task History


GET /task-board/${taskId}
// Use response.data.history to show timeline


---

## Testing Endpoints

You can test with tools like Postman or curl:

# Create a task
curl -X POST http://localhost:3000/task-board \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "purchase_quotes",
    "title": "Get Steel Quotes",
    "currentStatus": "pending",
    "assignedTo": "user-uuid",
    "startDate": "2025-12-17"
  }'

# Get Kanban board
curl -X GET http://localhost:3000/task-board/kanban/purchase_quotes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update status (triggers automatic next stage creation)
curl -X PATCH http://localhost:3000/task-board/TASK_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "approved",
    "changedBy": "user-uuid"
  }'


---

## Notes for Frontend Developers

1. **Always validate status values** against the enum for each task type before sending to API
2. **Handle automatic task creation** - After approving a task, refresh the next stage's Kanban board
3. **Show loading states** during status updates as they trigger multiple database operations
4. **Display error messages** clearly, especially for Material Request approval validation
5. **Use WebSockets or polling** to keep Kanban boards updated in real-time if multiple users are working
6. **Task IDs are UUIDs** - Store them as strings
7. **Dates should be ISO 8601 format** - `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`

---

## Support

For questions or issues, contact the backend team or refer to the full API documentation at `/api-docs` (Swagger UI).
