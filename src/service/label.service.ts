import { Labels, TaskBoard, TaskLabels } from '../models';
import { sequelize } from '../config/database';

export class LabelService {
    /**
     * Create a new label
     */
    async createLabel(data: {
        name: string;
        color: string;
        description?: string;
        createdBy?: string;
    }) {
        try {
            const label = await Labels.create(data);
            return label;
        } catch (error) {
            throw new Error(`Failed to create label: ${(error as Error).message}`);
        }
    }

    /**
     * Get all labels
     */
    async getAllLabels() {
        try {
            const labels = await Labels.findAll({
                order: [['name', 'ASC']]
            });
            return labels;
        } catch (error) {
            throw new Error(`Failed to fetch labels: ${(error as Error).message}`);
        }
    }

    /**
     * Get label by ID
     */
    async getLabelById(labelId: string) {
        try {
            const label = await Labels.findByPk(labelId);
            if (!label) {
                throw new Error('Label not found');
            }
            return label;
        } catch (error) {
            throw new Error(`Failed to fetch label: ${(error as Error).message}`);
        }
    }

    /**
     * Update label
     */
    async updateLabel(labelId: string, data: {
        name?: string;
        color?: string;
        description?: string;
    }) {
        try {
            const label = await Labels.findByPk(labelId);
            if (!label) {
                throw new Error('Label not found');
            }

            await label.update(data);
            return label;
        } catch (error) {
            throw new Error(`Failed to update label: ${(error as Error).message}`);
        }
    }

    /**
     * Delete label (soft delete)
     */
    async deleteLabel(labelId: string) {
        const transaction = await sequelize.transaction();

        try {
            const label = await Labels.findByPk(labelId, { transaction });
            if (!label) {
                throw new Error('Label not found');
            }

            // Remove label from all tasks
            await TaskLabels.destroy({
                where: { labelId },
                transaction
            });

            // Soft delete the label
            await label.destroy({ transaction });

            await transaction.commit();
            return { success: true, message: 'Label deleted successfully' };
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Failed to delete label: ${(error as Error).message}`);
        }
    }

    /**
     * Assign label to task
     */
    async assignLabelToTask(data: {
        taskBoardId: string;
        labelId: string;
        assignedBy: string;
    }) {
        try {
            const { taskBoardId, labelId, assignedBy } = data;

            // Check if label already assigned
            const existing = await TaskLabels.findOne({
                where: { taskBoardId, labelId }
            });

            if (existing) {
                throw new Error('Label already assigned to this task');
            }

            const boardData = await TaskBoard.findByPk(taskBoardId);
            if (!boardData) {
                throw new Error('Task not found');
            }
            const taskLabel = await TaskLabels.create({
                taskBoardId: boardData.id as string,
                labelId,
                assignedBy,
                assignedAt: new Date()
            });

            // Return with label details
            const label = await Labels.findByPk(labelId);
            return {
                ...taskLabel.toJSON(),
                label: label?.toJSON()
            };
        } catch (error) {
            throw new Error(`Failed to assign label: ${(error as Error).message}`);
        }
    }

    /**
     * Remove label from task
     */
    async removeLabelFromTask(taskBoardId: string, labelId: string) {
        try {
            const taskLabel = await TaskLabels.findOne({
                where: { taskBoardId, labelId }
            });

            if (!taskLabel) {
                throw new Error('Label not assigned to this task');
            }

            await taskLabel.destroy();
            return { success: true, message: 'Label removed from task' };
        } catch (error) {
            throw new Error(`Failed to remove label: ${(error as Error).message}`);
        }
    }

    /**
     * Get all labels for a task
     */
    async getTaskLabels(taskBoardId: string) {
        try {
            const taskLabels = await TaskLabels.findAll({
                where: { taskBoardId },
                include: [
                    {
                        model: Labels,
                        as: 'label'
                    }
                ]
            });

            return taskLabels.map(tl => ({
                id: tl.dataValues.id,
                labelId: tl.dataValues.labelId,
                name: ((tl.dataValues as any).label as any)?.name,
                color: ((tl.dataValues as any).label as any)?.color,
                description: ((tl.dataValues as any).label as any)?.description,
                assignedBy: tl.dataValues.assignedBy,
                assignedAt: tl.dataValues.assignedAt
            }));
        } catch (error) {
            throw new Error(`Failed to fetch task labels: ${(error as Error).message}`);
        }
    }
}
