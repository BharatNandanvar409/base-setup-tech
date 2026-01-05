import { Router } from 'express';
import { TaskBoardController } from '../controllers/task-board.controller';
import { LabelController } from '../controllers/label.controller';
import { authMiddleware, isLoggedIn } from '../middleware';
import { validate } from '../middleware/validator.middleware';
import { taskBoardCreateSchema, taskBoardUpdateStatusSchema, taskBoardListSchema, taskBoardDragDropSchema } from '../validators/task-board.validator';
import { assignLabelSchema } from '../validators/label.validator';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();
const controller = new TaskBoardController();
const labelController = new LabelController();

// Create a new task at any workflow stage
router.post('/', authMiddleware, isLoggedIn, controller.create.bind(controller)); //validate(taskBoardCreateSchema),

// Update task status with cascading completion
router.patch('/:id/status', authMiddleware, isLoggedIn, controller.updateStatus.bind(controller)); //validate(taskBoardUpdateStatusSchema)

// Drag and drop status update
router.patch('/:id/drag-drop', authMiddleware, isLoggedIn, validate(taskBoardDragDropSchema), controller.dragDropUpdate.bind(controller));

// Get Kanban board view for a specific task type
router.get('/kanban/:taskType', authMiddleware, isLoggedIn, controller.getKanbanBoard.bind(controller));

// Label assignment routes
router.post('/:taskId/labels', authMiddleware, isLoggedIn, validate(assignLabelSchema), labelController.assignToTask.bind(labelController));
router.delete('/:taskId/labels/:labelId', authMiddleware, isLoggedIn, labelController.removeFromTask.bind(labelController));
router.get('/:taskId/labels', authMiddleware, isLoggedIn, labelController.getTaskLabels.bind(labelController));

// Get all tasks with optional filtering
router.get('/', cacheMiddleware('taskBoardList', 120), controller.list.bind(controller));


// Get task by ID with history
router.get('/:id', authMiddleware, isLoggedIn, controller.get.bind(controller));



export default router;
