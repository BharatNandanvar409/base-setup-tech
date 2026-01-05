import { Request, Response } from 'express';
import { TaskBoardService } from '../service/task-board.service';
import { TaskType } from '../models';
import { AuditCollector } from '../utils/AuditCollector';
import { sequelize } from '../config/database';
// import { getID } from '../utils/socket.helper'; // adjust the import path to your socket setup

//solve this error: Cannot find name 'io'.
const taskBoardService = new TaskBoardService(); //getID()
export class TaskBoardController {
    /**
     * Create a new task at any workflow stage
     * POST /api/task-board
     */
    async create(req: any, res: Response) {
        const t = await sequelize.transaction();
        const audit = new AuditCollector(sequelize, t, {
            requestId: req.id,
            actorId: req.user?.id,
            method: req.method,
            path: req.path,
        });
        try {
            const { taskType, title, description, assignedTo, startDate, endDate, currentStatus, currentState, labels = [] } = req.body;
            console.log(req.body)

            const result = await taskBoardService.createTask({
                taskType: taskType as TaskType,
                title,
                description,
                assignedTo,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
                currentStatus,
                currentState: currentState || undefined,
                labels
            } as any);

            res.status(201).json({
                success: true,
                data: result,
                statusCode: 201,
                status: 'Success',
                message: 'Task created successfully'
            });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message,
                statusCode: 500,
                status: 'Error'
            });
        }
    }


    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { newStatus, newState, changedBy, title, description, assignedTo } = req.body;
            console.log(newStatus, newState, changedBy, "--------------------------------------------")

            if (!changedBy) {
                return res.status(400).json({
                    success: false,
                    message: 'changedBy is required',
                    statusCode: 400,
                    status: 'Error'
                });
            }
            const result = await taskBoardService.updateTaskStatus(id as any, {
                newStatus,
                newState,
                changedBy,
                title,
                description,
                assignedTo
            });

            res.status(200).json({
                success: true,
                data: result,
                statusCode: 200,
                status: 'Success',
                message: 'Task status updated successfully'
            });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message,
                statusCode: 500,
                status: 'Error'
            });
        }
    }

    /**
     * Get all tasks with optional filtering
     * GET /api/task-board
     */
    async list(req: Request, res: Response) {
        try {
            // await new Promise(res => setTimeout(res, 1500));

            // for (let i = 0; i < 10000; i++) {console.log(i, "looping") }

            const { taskType, assignedTo, currentStatus, page, limit } = req.query as any;

            const queryParams: any = {};
            if (taskType) queryParams.taskType = taskType as TaskType;
            if (assignedTo) queryParams.assignedTo = assignedTo;
            if (currentStatus) queryParams.currentStatus = currentStatus;
            if (page) queryParams.page = Number(page);
            if (limit) queryParams.limit = Number(limit);

            const result = await taskBoardService.getAllTasks(queryParams);

            res.status(200).json({
                success: true,
                data: result.tasks,
                total: result.totalRecords,
                totalPages: result.totalPages,
                page: result.page,
                limit: result.limit,
                statusCode: 200,
                status: 'Success'
            });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message,
                statusCode: 500,
                status: 'Error'
            });
        }
    }

    /**
     * Get task by ID with history
     * GET /api/task-board/:id
     */
    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Task ID is required',
                    statusCode: 400,
                    status: 'Error'
                });
            }

            const result = await taskBoardService.getTaskById(id);

            res.status(200).json({
                success: true,
                data: result,
                statusCode: 200,
                status: 'Success'
            });
        } catch (err: any) {
            const statusCode = err.message === 'Task not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: err.message,
                statusCode,
                status: 'Error'
            });
        }
    }

    /**
     * Get Kanban board view for a specific task type
     * GET /api/task-board/kanban/:taskType
     */
    async getKanbanBoard(req: Request, res: Response) {
        try {
            const { taskType } = req.params;
            const { labels } = req.query;

            let labelIds: string[] | undefined;

            if (labels) {
                if (typeof labels === 'string') {
                    labelIds = labels.split(',');
                } else if (Array.isArray(labels)) {
                    labelIds = labels as string[];
                }
            }

            const result = await taskBoardService.getKanbanBoard(taskType as TaskType, labelIds);

            res.status(200).json({
                success: true,
                data: result,
                statusCode: 200,
                status: 'Success'
            });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message,
                statusCode: 500,
                status: 'Error'
            });
        }
    }

    /**
     * Drag and drop status update
     * PATCH /api/task-board/:id/drag-drop
     */
    async dragDropUpdate(req: Request, res: Response) {
        try {

            const { id } = req.params;
            const { newStatus, changedBy } = req.body;
            console.log("--------------------------------------->", newStatus, changedBy)

            if (!changedBy) {
                return res.status(400).json({
                    success: false,
                    message: 'changedBy is required',
                    statusCode: 400,
                    status: 'Error'
                });
            }

            const result = await taskBoardService.dragDropStatusUpdate(id as any, {
                newStatus,
                changedBy
            });

            res.status(200).json({
                success: true,
                data: result,
                statusCode: 200,
                status: 'Success'
            });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message,
                statusCode: 500,
                status: 'Error'
            });
        }
    }
}
