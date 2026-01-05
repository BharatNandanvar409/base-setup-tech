import {
    TaskBoard, TaskStatusHistory, TaskType,
    MaterialRequest, MaterialRequestStatus,
    PurchaseRequest, PurchaseRequestStatus,
    PurchaseQuotes, PurchaseQuotesStatus,
    PurchaseOrder, PurchaseOrderStatus,
    ProformaInvoice, ProformaInvoiceStatus,
    Container, ContainerStatus,
    PackagingList, PackagingListStatus,
    CommercialInvoice, CommercialInvoiceStatus,
    TaskLabels,
    Labels,
    TaskAssignedUsers,
    Users
} from '../models';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { getIO } from '../utils/socket.helper';
import { NotificationControllerClass } from '../controllers/notifications.controller';

// Workflow order mapping
const WORKFLOW_ORDER = [
    TaskType.MATERIAL_REQUEST,
    TaskType.PURCHASE_REQUEST,
    TaskType.PURCHASE_QUOTES,
    TaskType.PURCHASE_ORDER,
    TaskType.PROFORMA_INVOICE,
    TaskType.CONTAINER,
    TaskType.PACKAGING_LIST,
    TaskType.COMMERCIAL_INVOICE
];

// Model mapping for each task type
const TASK_TYPE_MODEL_MAP: Record<TaskType, any> = {
    [TaskType.MATERIAL_REQUEST]: MaterialRequest,
    [TaskType.PURCHASE_REQUEST]: PurchaseRequest,
    [TaskType.PURCHASE_QUOTES]: PurchaseQuotes,
    [TaskType.PURCHASE_ORDER]: PurchaseOrder,
    [TaskType.PROFORMA_INVOICE]: ProformaInvoice,
    [TaskType.CONTAINER]: Container,
    [TaskType.PACKAGING_LIST]: PackagingList,
    [TaskType.COMMERCIAL_INVOICE]: CommercialInvoice
};

// Completed status for each task type
const COMPLETED_STATUS_MAP: Record<TaskType, string> = {
    [TaskType.MATERIAL_REQUEST]: MaterialRequestStatus.COMPLETED,
    [TaskType.PURCHASE_REQUEST]: PurchaseRequestStatus.COMPLETED,
    [TaskType.PURCHASE_QUOTES]: PurchaseQuotesStatus.COMPLETED,
    [TaskType.PURCHASE_ORDER]: PurchaseOrderStatus.COMPLETED,
    [TaskType.PROFORMA_INVOICE]: ProformaInvoiceStatus.COMPLETED,
    [TaskType.CONTAINER]: ContainerStatus.COMPLETED,
    [TaskType.PACKAGING_LIST]: PackagingListStatus.COMPLETED,
    [TaskType.COMMERCIAL_INVOICE]: CommercialInvoiceStatus.COMPLETED
};

// Status enums for each task type (for Kanban board)
const STATUS_ENUM_MAP: Record<TaskType, any> = {
    [TaskType.MATERIAL_REQUEST]: MaterialRequestStatus,
    [TaskType.PURCHASE_REQUEST]: PurchaseRequestStatus,
    [TaskType.PURCHASE_QUOTES]: PurchaseQuotesStatus,
    [TaskType.PURCHASE_ORDER]: PurchaseOrderStatus,
    [TaskType.PROFORMA_INVOICE]: ProformaInvoiceStatus,
    [TaskType.CONTAINER]: ContainerStatus,
    [TaskType.PACKAGING_LIST]: PackagingListStatus,
    [TaskType.COMMERCIAL_INVOICE]: CommercialInvoiceStatus
};

// Approved status for each task type (triggers next stage creation)
const APPROVED_STATUS_MAP: Record<TaskType, string> = {
    [TaskType.MATERIAL_REQUEST]: MaterialRequestStatus.APPROVED,
    [TaskType.PURCHASE_REQUEST]: PurchaseRequestStatus.APPROVED,
    [TaskType.PURCHASE_QUOTES]: PurchaseQuotesStatus.APPROVED,
    [TaskType.PURCHASE_ORDER]: PurchaseOrderStatus.APPROVED,
    [TaskType.PROFORMA_INVOICE]: ProformaInvoiceStatus.PENDING,
    [TaskType.CONTAINER]: ContainerStatus.PENDING,
    [TaskType.PACKAGING_LIST]: PackagingListStatus.PENDING,
    [TaskType.COMMERCIAL_INVOICE]: CommercialInvoiceStatus.PENDING
};

// Pending/initial status for each task type
const PENDING_STATUS_MAP: Record<TaskType, string> = {
    [TaskType.MATERIAL_REQUEST]: MaterialRequestStatus.PENDING,
    [TaskType.PURCHASE_REQUEST]: PurchaseRequestStatus.PENDING,
    [TaskType.PURCHASE_QUOTES]: PurchaseQuotesStatus.PENDING,
    [TaskType.PURCHASE_ORDER]: PurchaseOrderStatus.PENDING,
    [TaskType.PROFORMA_INVOICE]: ProformaInvoiceStatus.PENDING,
    [TaskType.CONTAINER]: ContainerStatus.PENDING,
    [TaskType.PACKAGING_LIST]: PackagingListStatus.PENDING,
    [TaskType.COMMERCIAL_INVOICE]: CommercialInvoiceStatus.PENDING
};

const notificationService = new NotificationControllerClass();
export class TaskBoardService {
    /**
     * Create a new task at any workflow stage
     */
    async createTask(data: {
        taskType: TaskType;
        title: string;
        description?: string;
        assignedTo?: string[];
        startDate: Date;
        endDate?: Date;
        currentStatus: string;
        currentState?: string;
        labels?: string[];
    }) {
        const transaction = await sequelize.transaction();

        try {
            const { taskType, title, description, assignedTo, startDate, endDate, currentStatus, currentState, labels } = data;
            // Get the model for the task type
            const TaskModel = TASK_TYPE_MODEL_MAP[taskType];
            if (!TaskModel) {
                throw new Error(`Invalid task type: ${taskType}`);
            }

            // Create the procurement entity
            const procurementEntity = await TaskModel.create({
                title,
                description,
                startDate,
                endDate,
                status: currentStatus
            }, { transaction });

            // Create task board entry
            const taskBoard = await TaskBoard.create({
                taskType,
                taskId: procurementEntity.id,
                currentState,
                currentStatus,
                labels
            } as any, { transaction });

            // Create task labels
            if (labels && labels.length > 0 && taskBoard.id) {
                const labelsData = labels.map((labelId: any) => {
                    const entry: any = {
                        taskBoardId: taskBoard.id,
                        labelId: labelId?.id as any,
                        assignedAt: new Date()
                    };
                    return entry;
                });
                await TaskLabels.bulkCreate(labelsData, { transaction });
            }

            if (assignedTo && assignedTo.length > 0) {
                const assignedUsersData = assignedTo.map((userId: any) => {
                    const entry: any = {
                        taskBoardId: taskBoard.id,
                        userId: userId,
                        taskId: procurementEntity.id,
                        assignedAt: new Date()
                    };
                    if (assignedTo) entry.assignedBy = assignedTo;
                    return entry;
                });
                await TaskAssignedUsers.bulkCreate(assignedUsersData, { transaction });
                // but we need to get the token of the user to send notification
                for (const userId of assignedTo) { 
                    console.log(userId)
                    const userFCMToken = await Users.findOne({
                        where:{
                            id: userId
                        },
                        attributes:[
                            'id',
                            'fcmToken'
                        ]
                    })
                    notificationService.sendNotification({
                        token: (userFCMToken?.dataValues?.fcmToken as string) || '',
                        title: 'Task Assigned',
                        body: `You have been assigned to task: ${title}`,
                        data: {
                            taskId: taskBoard.id,
                            taskType,
                            status: currentStatus,
                            state: currentState,
                        }
                    });
                }
            }
            // Record initial status in history
            await TaskStatusHistory.create({
                taskId: taskBoard.id as any,
                oldState: null as any,
                newState: currentState as any,
                oldStatus: null as any,
                newStatus: currentStatus as any,
                changedBy: assignedTo?.[0] || 'system',
                changedAt: new Date()
            }, { transaction });

            await transaction.commit();
            return {
                taskBoard,
                procurementEntity
            };
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Failed to create task: ${(error as Error).message}`);
        }
    }

    /**
     * Update task status with cascading completion logic
     */
    async updateTaskStatus(
        taskBoardId: string,
        data: {
            newStatus: string;
            newState?: string;
            changedBy: string;
            title?: string;
            description?: string;
            assignedTo?: string[];
        }
    ) {
        const transaction = await sequelize.transaction();        
        try {
            // not only the status but the assigned user also the title and desc can be updated 
            const { newStatus, newState, changedBy, title, description, assignedTo } = data;

            // Find the task board entry
            const taskBoard = await TaskBoard.findOne({ where: { taskId: taskBoardId }, transaction });
            if (!taskBoard) {
                throw new Error('Task not found');
            }

            const oldStatus = taskBoard.dataValues.currentStatus;
            const oldState = taskBoard.dataValues.currentState;

            // Get the procurement entity
            const TaskModel = TASK_TYPE_MODEL_MAP[taskBoard.dataValues.taskType];
            const procurementEntity = await TaskModel.findByPk(taskBoard.dataValues.taskId, { transaction });

            // Validation: Material Request can only be approved if all previous statuses are complete
            if (taskBoard.dataValues.taskType === TaskType.MATERIAL_REQUEST && newStatus === MaterialRequestStatus.APPROVED) {
                const requiredStatuses = [
                    MaterialRequestStatus.PENDING,
                    MaterialRequestStatus.IN_PURCHASE_REQ,
                    MaterialRequestStatus.RECEIVED_FROM_VENDOR,
                    MaterialRequestStatus.SEND_FOR_PICKUP,
                    MaterialRequestStatus.READY_FOR_PICKUP
                ];

                // Check if the task has gone through all required statuses
                const statusHistory = await TaskStatusHistory.findAll({
                    where: { taskId: taskBoard.dataValues.taskId },
                    order: [['changedAt', 'ASC']],
                    transaction
                });

                const completedStatuses = new Set(statusHistory.map(h => h.newStatus));
                const missingStatuses = requiredStatuses.filter(s => !completedStatuses.has(s) && s !== oldStatus);

                if (missingStatuses.length > 0) {
                    throw new Error(`Material Request cannot be approved. Missing required statuses: ${missingStatuses.join(', ')}`);
                }
            }

            if (taskBoard.dataValues.taskType === TaskType.MATERIAL_REQUEST && newStatus === MaterialRequestStatus.COMPLETED) {
                const FinalModel = TASK_TYPE_MODEL_MAP[TaskType.COMMERCIAL_INVOICE];
                const finalEntity = await FinalModel.findOne({
                    where: { title: procurementEntity?.dataValues?.title },
                    transaction
                });
                if (!finalEntity) {
                    throw new Error('Final stage task not found for this workflow');
                }
                const finalTaskBoard = await TaskBoard.findOne({
                    where: { taskType: TaskType.COMMERCIAL_INVOICE, taskId: finalEntity.dataValues.id },
                    transaction
                });
                if (!finalTaskBoard || finalTaskBoard.dataValues.currentStatus !== CommercialInvoiceStatus.COMPLETED) {
                    throw new Error('Material Request cannot be completed until final stage is completed');
                }
            }

            // Update the procurement entity status
            await TaskModel.update(
                { status: newStatus },
                { where: { id: taskBoard.dataValues.taskId }, transaction }
            );

            const taskModel =  TaskModel.findByPk(taskBoard.dataValues.taskId, { transaction });

            // Update task board
            await taskBoard.update({
                currentStatus: newStatus,
                currentState: newState || oldState
            } as any, { transaction });

            // Record status change in history
            console.log('oldState', oldState, 'newState', newState || oldState);
            if (newStatus){
                await TaskStatusHistory.create({
                    taskId: taskBoard.dataValues.id as any,
                    oldState,
                    newState: newState || oldState,
                    oldStatus,
                    newStatus,
                    changedBy,
                    changedAt: new Date()
                } as any, { transaction });
            }

            // Automatic next stage task creation when approved
            const approvedStatus = APPROVED_STATUS_MAP[taskBoard.dataValues.taskType];
            if (newStatus === approvedStatus) {
                await this.createNextStageTask(taskBoard, procurementEntity, changedBy, transaction);
            }

            const completedStatus = COMPLETED_STATUS_MAP[taskBoard.dataValues.taskType];
            if (newStatus === completedStatus) {
                await this.markMaterialRequestCompletedIfFinalCompleted(taskBoard, procurementEntity, changedBy, transaction);
            }

            // emit socket event here for the task board update
            const io = getIO();
            io.emit('taskBoardUpdate', {
                taskBoardId: taskBoard.dataValues.id,
                newStatus,
                newState: newState || oldState,
                changedBy,
                changedAt: new Date()
            });

            console.log('✅ taskBoardUpdate emitted');
            if(title){
                taskModel.set({
                    title
                } as any, { transaction });
                await taskModel.save({ transaction });
            }
            if(description){
                taskModel.set({
                    description
                } as any, { transaction });
                await taskModel.save({ transaction });
            }
            if(assignedTo){
                // check all prev assniged users on this task
                const prevAssignedTo = await TaskAssignedUsers.findAll({
                    where: { taskId: taskBoardId }
                });
                // delete all prev assigned users
                await TaskAssignedUsers.destroy({
                    where: { taskId: taskBoardId },
                    transaction
                });
                // add new assigned users
                await TaskAssignedUsers.bulkCreate(assignedTo.map(assignedUserId => ({
                    taskId: taskBoardId,
                    assignedUserId
                }) as any), { transaction });
            }
            
            await transaction.commit();
            return {
                taskBoard: await TaskBoard.findByPk(taskBoardId),
                statusHistory: await TaskStatusHistory.findAll({
                    where: { taskId: taskBoardId },
                    order: [['changedAt', 'DESC']]
                })
            };
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Failed to update task status: ${(error as Error).message}`);
        }
    }

    /**
     * Create a task in the next workflow stage automatically
     */
    private async createNextStageTask(
        currentTaskBoard: any,
        currentProcurementEntity: any,
        changedBy: string,
        transaction: any
    ) {
        const currentIndex = WORKFLOW_ORDER.indexOf(currentTaskBoard.dataValues.taskType);

        // Check if there is a next stage
        if (currentIndex === -1 || currentIndex >= WORKFLOW_ORDER.length - 1) {
            return; // No next stage or last stage
        }

        const nextTaskType = WORKFLOW_ORDER[currentIndex + 1];
        if (nextTaskType === undefined) {
            return;
        }
        const NextTaskModel = TASK_TYPE_MODEL_MAP[nextTaskType];
        const nextPendingStatus = PENDING_STATUS_MAP[nextTaskType];

        // Check if task with same name already exists in next stage
        const nextTitle = `${currentProcurementEntity.dataValues.title}`;
        const existingTask = await NextTaskModel.findOne({
            where: { title: nextTitle },
            transaction
        });

        if (existingTask) {
            return; // Task already created
        }

        // Create the next stage procurement entity
        const nextProcurementEntity = await NextTaskModel.create({
            title: nextTitle,
            description: `Auto-created from ${currentTaskBoard.dataValues.taskType}: ${currentProcurementEntity.dataValues.title}`,
            assignedTo: currentTaskBoard.dataValues.assignedTo,
            startDate: new Date(),
            endDate: currentProcurementEntity.dataValues.endDate,
            status: nextPendingStatus
        }, { transaction });

        // Create task board entry for next stage
        const nextTaskBoard = await TaskBoard.create({
            taskType: nextTaskType,
            taskId: nextProcurementEntity.dataValues.id,
            currentState: 'auto-created',
            currentStatus: nextPendingStatus,
            assignedTo: currentTaskBoard.dataValues.assignedTo
        } as any, { transaction });

        // Copy labels from current task to next task
        if (currentTaskBoard.dataValues.id) {
            const currentLabels = await TaskLabels.findAll({
                where: { taskBoardId: currentTaskBoard.dataValues.id },
                transaction
            });

            if (currentLabels.length > 0 && nextTaskBoard.id) {
                const newLabelsData = currentLabels.map(label => ({
                    taskBoardId: nextTaskBoard.id as string,
                    labelId: label.labelId,
                    assignedBy: changedBy,
                    assignedAt: new Date()
                }));

                await TaskLabels.bulkCreate(newLabelsData, { transaction });
            }
        }

        // Record initial status in history
        await TaskStatusHistory.create({
            taskId: nextTaskBoard.id as any,
            oldState: null as any,
            newState: 'auto-created' as any,
            oldStatus: null as any,
            newStatus: nextPendingStatus,
            changedBy,
            changedAt: new Date()
        }, { transaction });
    }

    private async markMaterialRequestCompletedIfFinalCompleted(
        currentTaskBoard: any,
        currentProcurementEntity: any,
        changedBy: string,
        transaction: any
    ) {
        if (currentTaskBoard.dataValues.taskType !== TaskType.COMMERCIAL_INVOICE) {
            return;
        }
        const FinalModel = TASK_TYPE_MODEL_MAP[TaskType.COMMERCIAL_INVOICE];
        const finalEntity = await FinalModel.findByPk(currentTaskBoard.dataValues.taskId, { transaction });
        const mrModel = TASK_TYPE_MODEL_MAP[TaskType.MATERIAL_REQUEST];
        const mrEntity = await mrModel.findOne({
            where: { title: currentProcurementEntity?.dataValues?.title },
            transaction
        });
        if (!mrEntity) {
            return;
        }
        const mrTaskBoard = await TaskBoard.findOne({
            where: { taskType: TaskType.MATERIAL_REQUEST, taskId: mrEntity.dataValues.id },
            transaction
        });
        if (!mrTaskBoard) {
            return;
        }
        const mrCompleted = COMPLETED_STATUS_MAP[TaskType.MATERIAL_REQUEST];
        if (mrTaskBoard.dataValues.currentStatus === mrCompleted) {
            return;
        }
        await mrModel.update(
            { status: mrCompleted },
            { where: { id: mrEntity.dataValues.id }, transaction }
        );
        const oldStatus = mrTaskBoard.dataValues.currentStatus;
        await mrTaskBoard.update({ currentStatus: mrCompleted } as any, { transaction });
        await TaskStatusHistory.create({
            taskId: mrTaskBoard.dataValues.id as any,
            oldState: mrTaskBoard.dataValues.currentState || null as any,
            newState: mrTaskBoard.dataValues.currentState || null as any,
            oldStatus: oldStatus || null as any,
            newStatus: mrCompleted,
            changedBy,
            changedAt: new Date()
        }, { transaction });
    }

    /**
     * Get all tasks with optional filtering
     */
    // async getAllTasks(queryParams: {
    //     taskType?: TaskType;
    //     assignedTo?: string;
    //     currentStatus?: string;
    //     page?: number;
    //     limit?: number;
    // }) {
    //     const page = queryParams.page || 1;
    //     const limit = queryParams.limit || 10;
    //     const offset = (page - 1) * limit;

    //     const where: any = {};
    //     if (queryParams.taskType) where.taskType = queryParams.taskType;
    //     if (queryParams.assignedTo) where.assignedTo = queryParams.assignedTo;
    //     if (queryParams.currentStatus) where.currentStatus = queryParams.currentStatus;

    //     const { rows, count } = await TaskBoard.findAndCountAll({
    //         where,
    //         offset,
    //         limit,
    //         order: [['createdAt', 'DESC']]
    //     });

    //     const taskDetails = await Promise.all(rows.map(async (task) => {
    //         const TaskModel = TASK_TYPE_MODEL_MAP[task.dataValues.taskType];
    //         const procurementEntity = await TaskModel.findByPk(task.dataValues.taskId);
    //         return {
    //             ...task.dataValues,
    //             task: procurementEntity
    //         };
    //     }));
    //     return {
    //         tasks: taskDetails,
    //         page,
    //         limit,
    //         totalRecords: count,
    //         totalPages: Math.ceil(count / limit)
    //     };
    // }

    async getAllTasks(queryParams: {
        taskType?: TaskType;
        assignedTo?: string;
        currentStatus?: string;
        page?: number;
        limit?: number;
    }) {
        const page = queryParams.page || 1;
        const limit = queryParams.limit || 10;
        const offset = (page - 1) * limit;

        const where: any = {};
        if (queryParams.taskType) where.taskType = queryParams.taskType;
        if (queryParams.assignedTo) where.assignedTo = queryParams.assignedTo;
        if (queryParams.currentStatus) where.currentStatus = queryParams.currentStatus;

        const { rows, count } = await TaskBoard.findAndCountAll({
            where,
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });

        // Group by taskType
        const groupedByType = rows.reduce((acc, task) => {
            const type = task.dataValues.taskType;
            console.log(type)
            // console.log(type?.taskType)

            if (!acc[type]) acc[type] = [];
            acc[type].push(task.dataValues.taskId);
            return acc;
        }, {} as Record<TaskType, string[]>);

        // Fetch related entities in batches
        const taskDetailsMap: Record<string, any> = {};

        for (const [taskType, ids] of Object.entries(groupedByType)) {
            const Model = TASK_TYPE_MODEL_MAP[taskType as TaskType];
            console.log(Model);

            const records = await Model.findAll({
                where: { id: ids }
            });

            records.forEach((r: any) => {
                taskDetailsMap[r.id] = r;
            });
        }
        console.log(taskDetailsMap)
        const task = rows.map((task: any) => ({
            ...task.dataValues,
            task: taskDetailsMap[task.dataValues.taskId] || null
        }));

        return {
            tasks: task,
            page,
            limit,
            totalRecords: count,
            totalPages: Math.ceil(count / limit)
        };
    }


    /**
     * Get task by ID with history
     */
    async getTaskById(taskBoardId: string) {
        const taskBoard = await TaskBoard.findByPk(taskBoardId);
        if (!taskBoard) {
            throw new Error('Task not found');
        }

        const history = await TaskStatusHistory.findAll({
            where: { taskId: taskBoardId },
            order: [['changedAt', 'DESC']]
        });

        // Get the procurement entity
        const TaskModel = TASK_TYPE_MODEL_MAP[taskBoard.dataValues.taskType];
        const procurementEntity = await TaskModel.findByPk(taskBoard.dataValues.taskId);

        // Get task labels
        const taskLabels = await TaskLabels.findAll({
            where: { taskBoardId },
            include: [{
                model: Labels,
                as: 'label'
            }]
        });

        const labels = taskLabels.map((tl: any) => ({
            id: tl.dataValues.labelId,
            name: tl.dataValues.label?.name,
            color: tl.dataValues.label?.color,
            assignedBy: tl.dataValues.assignedBy,
            assignedAt: tl.dataValues.assignedAt
        }));

        return {
            taskBoard,
            procurementEntity,
            history,
            labels
        };
    }

    /**
     * Get Kanban board view for a specific task type
     * Groups tasks by their status
     */
    async getKanbanBoard(taskType: TaskType, labelIds?: string[]) {

        const StatusEnum = STATUS_ENUM_MAP[taskType];
        if (!StatusEnum) {
            throw new Error(`Invalid task type: ${taskType}`);
        }

        const statuses = Object.values(StatusEnum);

        /** ----------------------------------------
         * 1️⃣ Build WHERE clause
         * ---------------------------------------- */
        const whereClause: any = { taskType };

        if (labelIds?.length) {
            const taskBoardIds = await TaskLabels.findAll({
                where: { labelId: { [Op.in]: labelIds } },
                attributes: ['taskBoardId'],
                raw: true
            }).then(res => res.map(r => r.taskBoardId));

            if (!taskBoardIds.length) {
                // Return empty board with statuses
                return {
                    taskType,
                    statuses,
                    board: Object.fromEntries(statuses.map(s => [s, []])),
                    totalTasks: 0
                };
            }

            whereClause.id = { [Op.in]: taskBoardIds };
        }

        /** ----------------------------------------
         * 2️⃣ Fetch all task boards (ONE query)
         * ---------------------------------------- */
        const taskBoards = await TaskBoard.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            raw: true
        });



        // need to send the username who is assigned to the task

        if (!taskBoards.length) {
            return {
                taskType,
                statuses,
                board: Object.fromEntries(statuses.map(s => [s, []])),
                totalTasks: 0
            };
        }

        /** ----------------------------------------
         * 3️⃣ Fetch procurement entities (ONE query) 
         * ---------------------------------------- */
        const taskIds = taskBoards.map(t => t.taskId);
        const TaskModel = TASK_TYPE_MODEL_MAP[taskType];

        const procurementEntities = await TaskModel.findAll({
            where: { id: { [Op.in]: taskIds } },
            raw: true
        });

        const procurementMap = new Map(
            procurementEntities.map((e: any) => [e.id, e])
        );

        /** ----------------------------------------
         * 4️⃣ Fetch labels for all tasks (ONE query)
         * ---------------------------------------- */
        const labels = await TaskLabels.findAll({
            where: { taskBoardId: { [Op.in]: taskBoards.map((t: any) => t.id) } },
            include: [{
                model: Labels,
                as: 'label',
                attributes: ['id', 'name', 'color']
            }],
            raw: true,
            nest: true
        });

        const labelsMap = new Map<number, any[]>();

        for (const l of labels) {
            if (!labelsMap.has((l as any)?.taskBoardId)) {
                labelsMap.set((l as any)?.taskBoardId, []);
            }
            labelsMap.get((l as any)?.taskBoardId)!.push({
                id: (l as any)?.label?.id,
                name: (l as any)?.label?.name,
                color: (l as any)?.label?.color
            });
        }

        /** ----------------------------------------
         * 4️⃣ Fetch Users for all tasks (ONE query)
         * ---------------------------------------- */
        const assignedUsers = await TaskAssignedUsers.findAll({
            where: { taskBoardId: { [Op.in]: taskBoards.map((t: any) => t.id) } },
            attributes: ['taskBoardId', 'userId'],
            include: [{
                model: Users,
                as: 'user',
                attributes: ['id', 'username', 'email']
            }],
        });
        console.log(assignedUsers);

        const assignedUsersMap = new Map<number, string[]>();

        for (const u of assignedUsers) {
            const taskBoardId = (u as any).taskBoardId;
            const username = (u as any).user?.dataValues?.username;

            if (!taskBoardId || !username) continue;

            if (!assignedUsersMap.has(taskBoardId)) {
                assignedUsersMap.set(taskBoardId, []);
            }

            console.log(taskBoardId, username);
            console.log(assignedUsersMap.get(taskBoardId));
            assignedUsersMap.get(taskBoardId)!.push(username);
        }




        /** ----------------------------------------
         * 5️⃣ Build Kanban board (ONE loop)
         * ---------------------------------------- */
        const board: Record<string, any[]> = {};
        statuses.forEach((s: any) => board[s] = []);

        for (const task of taskBoards) {
            const status = (task as any).currentStatus;
            if (board[status]) {
                board[status].push({
                    taskBoard: task,
                    procurementEntity: procurementMap.get((task as any).taskId) || null,
                    labels: labelsMap.get((task as any).id) || [],
                    assignedUsers: assignedUsersMap.get((task as any).id) || []
                });
            }
        }

        return {
            taskType,
            statuses,
            board,
            totalTasks: taskBoards.length
        };
    }


    /**
     * Drag and drop status update
     * Updates task status when dragged to a new column
     */
    async dragDropStatusUpdate(
        taskBoardId: string,
        data: {
            newStatus: string;
            changedBy: string;
        }
    ) {
        const transaction = await sequelize.transaction();

        try {
            const { newStatus, changedBy } = data;

            // Find the task board entry
            const taskBoard = await TaskBoard.findByPk(taskBoardId, { transaction });
            if (!taskBoard) {
                throw new Error('Task not found');
            }

            const oldStatus = taskBoard.dataValues.currentStatus;
            const oldState = taskBoard.dataValues.currentState;

            // Get the procurement entity
            const TaskModel = TASK_TYPE_MODEL_MAP[taskBoard.dataValues.taskType];
            const procurementEntity = await TaskModel.findByPk(taskBoard.dataValues.taskId, { transaction });

            if (taskBoard.dataValues.taskType === TaskType.MATERIAL_REQUEST && newStatus === MaterialRequestStatus.COMPLETED) {
                const FinalModel = TASK_TYPE_MODEL_MAP[TaskType.COMMERCIAL_INVOICE];
                const finalEntity = await FinalModel.findOne({
                    where: { title: procurementEntity?.dataValues?.title },
                    transaction
                });
                if (!finalEntity) {
                    throw new Error('Final stage task not found for this workflow');
                }
                const finalTaskBoard = await TaskBoard.findOne({
                    where: { taskType: TaskType.COMMERCIAL_INVOICE, taskId: finalEntity.dataValues.id },
                    transaction
                });
                if (!finalTaskBoard || finalTaskBoard.dataValues.currentStatus !== CommercialInvoiceStatus.COMPLETED) {
                    throw new Error('Material Request cannot be completed until final stage is completed');
                }
            }

            // Validate that the new status is valid for this task type
            const StatusEnum = STATUS_ENUM_MAP[taskBoard.dataValues.taskType];
            const validStatuses = Object.values(StatusEnum);

            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Invalid status '${newStatus}' for task type '${taskBoard.dataValues.taskType}'`);
            }

            // Update the procurement entity status
            await TaskModel.update(
                { status: newStatus },
                { where: { id: taskBoard.dataValues.taskId }, transaction }
            );

            // Update task board
            await taskBoard.update({
                currentStatus: newStatus
            } as any, { transaction });

            // Record status change in history
            await TaskStatusHistory.create({
                taskId: taskBoard.id as any,
                oldState: oldState || null as any,
                newState: oldState || null as any,
                oldStatus: oldStatus || null as any,
                newStatus,
                changedBy,
                changedAt: new Date()
            }, { transaction });

            // Automatic next stage task creation when approved
            const approvedStatus = APPROVED_STATUS_MAP[taskBoard.dataValues.taskType];
            const completedStatus = COMPLETED_STATUS_MAP[taskBoard.dataValues.taskType];
            if (newStatus === approvedStatus || newStatus === completedStatus) {
                await this.createNextStageTask(taskBoard, procurementEntity, changedBy, transaction);
            }

            if (newStatus === completedStatus) {
                await this.markMaterialRequestCompletedIfFinalCompleted(taskBoard, procurementEntity, changedBy, transaction);
            }

            await transaction.commit();

            const io = getIO();
            io.emit('taskBoardUpdate', {
                taskBoardId: taskBoard.dataValues.id,
                newStatus,
                newState: data.newStatus || oldState,
                changedBy,
                changedAt: new Date()
            });

            console.log('✅ taskBoardUpdate emitted');
            return {
                success: true,
                taskBoard: await TaskBoard.findByPk(taskBoardId),
                message: `Task moved from '${oldStatus}' to '${newStatus}'`
            };
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Failed to update task status: ${(error as Error).message}`);
        }
    }

    async getTaskAuditTrail(taskBoardId: string) {
        const history = await TaskStatusHistory.findAll({
            where: { taskId: taskBoardId },
            order: [['changedAt', 'ASC']]
        });
        return history;
    }

    async getWorkflowAuditTrail(taskBoardId: string) {
        const taskBoard = await TaskBoard.findByPk(taskBoardId);
        if (!taskBoard) {
            throw new Error('Task not found');
        }
        const TaskModel = TASK_TYPE_MODEL_MAP[taskBoard.dataValues.taskType];
        const entity = await TaskModel.findByPk(taskBoard.dataValues.taskId);
        const title = entity?.dataValues?.title;
        if (!title) {
            return [];
        }
        const histories: any[] = [];
        for (const t of WORKFLOW_ORDER) {
            const Model = TASK_TYPE_MODEL_MAP[t];
            const e = await Model.findOne({ where: { title } });
            if (!e) continue;
            const tb = await TaskBoard.findOne({ where: { taskType: t, taskId: e.dataValues.id } });
            if (!tb) continue;
            const h = await TaskStatusHistory.findAll({
                where: { taskId: tb.dataValues.id },
                order: [['changedAt', 'ASC']]
            });
            histories.push(...h.map(x => ({ ...x.toJSON(), stage: t })));
        }
        return histories;
    }
}
