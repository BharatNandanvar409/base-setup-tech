import { Request, Response } from 'express';
import { LabelService } from '../service/label.service';

const labelService = new LabelService();

export class LabelController {
    /**
     * Create a new label
     * POST /labels
     */
    async create(req: Request, res: Response) {
        try {
            const { name, color, description } = req.body;
            const createdBy = (req as any).user?.id;

            const label = await labelService.createLabel({
                name,
                color,
                description,
                createdBy
            });

            res.status(201).json({
                success: true,
                data: label,
                statusCode: 201,
                status: 'Success',
                message: 'Label created successfully'
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
     * Get all labels
     * GET /labels
     */
    async list(req: Request, res: Response) {
        try {
            const labels = await labelService.getAllLabels();

            res.status(200).json({
                success: true,
                data: labels,
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
     * Get label by ID
     * GET /labels/:id
     */
    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const label = await labelService.getLabelById(id as string);

            res.status(200).json({
                success: true,
                data: label,
                statusCode: 200,
                status: 'Success'
            });
        } catch (err: any) {
            const statusCode = err.message === 'Label not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: err.message,
                statusCode,
                status: 'Error'
            });
        }
    }

    /**
     * Update label
     * PATCH /labels/:id
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, color, description } = req.body;

            const label = await labelService.updateLabel(id as string, {
                name,
                color,
                description
            });

            res.status(200).json({
                success: true,
                data: label,
                statusCode: 200,
                status: 'Success',
                message: 'Label updated successfully'
            });
        } catch (err: any) {
            const statusCode = err.message === 'Label not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: err.message,
                statusCode,
                status: 'Error'
            });
        }
    }

    /**
     * Delete label
     * DELETE /labels/:id
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await labelService.deleteLabel(id as string);

            res.status(200).json({
                success: true,
                data: result,
                statusCode: 200,
                status: 'Success'
            });
        } catch (err: any) {
            const statusCode = err.message === 'Label not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: err.message,
                statusCode,
                status: 'Error'
            });
        }
    }

    /**
     * Assign label to task
     * POST /task-board/:taskId/labels
     */
    async assignToTask(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const { labelId, assignedBy } = req.body;


            const result = await labelService.assignLabelToTask({
                taskBoardId: taskId as string,
                labelId,
                assignedBy
            });

            res.status(201).json({
                success: true,
                data: result,
                statusCode: 201,
                status: 'Success',
                message: 'Label assigned to task'
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
     * Remove label from task
     * DELETE /task-board/:taskId/labels/:labelId
     */
    async removeFromTask(req: Request, res: Response) {
        try {
            const { taskId, labelId } = req.params;

            const result = await labelService.removeLabelFromTask(taskId as string, labelId as string);

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
     * Get task labels
     * GET /task-board/:taskId/labels
     */
    async getTaskLabels(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const labels = await labelService.getTaskLabels(taskId as string);

            res.status(200).json({
                success: true,
                data: labels,
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
