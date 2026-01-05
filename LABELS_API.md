# Task Labels API Documentation

## Overview

New Trello-style label system allows creating colored tags and assigning them to tasks.
Base URL: `http://localhost:5001`
Authentication: Bearer Token required for all endpoints.

## 1. Label Management

### Create Label
**POST** `/labels`
```json
{
  "name": "High Priority",
  "color": "#FF5733",
  "description": "Urgent tasks"
}
```
*   `color`: Must be a valid 6-character hex code (e.g., `#FF0000`).

### List Labels
**GET** `/labels`
Returns all available labels.
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid...",
      "name": "High Priority",
      "color": "#FF5733",
      "description": "Urgent tasks"
    }
  ]
}
```

### Update Label
**PATCH** `/labels/:id`
```json
{
  "name": "Critical",
  "color": "#E60000"
}
```

### Delete Label
**DELETE** `/labels/:id`
Soft deletes the label and removes it from all tasks.

---

## 2. Task Assignment

### Assign Label to Task
**POST** `/task-board/:taskId/labels`
```json
{
  "labelId": "label-uuid...",
  "assignedBy": "user-uuid..."
}
```

### Remove Label from Task
**DELETE** `/task-board/:taskId/labels/:labelId`

### Get Task Labels
**GET** `/task-board/:taskId/labels`

---

## 3. Updated Responses

### Kanban Board
**GET** `/task-board/kanban/:taskType`
Now includes a `labels` array for each task in the board.
Supports filtering by passing `labels` query parameter (comma-separated label IDs).
Example: `/task-board/kanban/MATERIAL_REQUEST?labels=id1,id2`

```json
{
  "board": {
    "pending": [
      {
        "taskBoard": { ... },
        "procurementEntity": { ... },
        "labels": [
          {
            "id": "label-uuid",
            "name": "High Priority",
            "color": "#FF5733"
          }
        ]
      }
    ]
  }
}
```

### Task Details
**GET** `/task-board/:id`
Includes `labels` array with assignment details.

```json
{
  "taskBoard": { ... },
  "labels": [
    {
      "id": "label-id",
      "name": "Urgent",
      "color": "#FF5733",
      "assignedBy": "user-id",
      "assignedAt": "2025-12-17T10:00:00Z"
    }
  ]
}
```

## Recommended Colors (Trello Style)
You can use these hex codes for the color picker:
- Green: `#61BD4F`
- Yellow: `#F2D600`
- Orange: `#FF9F1A`
- Red: `#EB5A46`
- Purple: `#C377E0`
- Blue: `#0079BF`
- Sky: `#00C2E0`
- Lime: `#51E898`
- Pink: `#FF78CB`
- Black: `#344563`
