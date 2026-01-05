import { Request, Response } from 'express';
import { ModuleService } from '../service/module.service';

const moduleService = new ModuleService();

export class ModuleController {
    async getModules(_req: Request, res: Response) {
        const data = moduleService.getModules();
        res.status(200).json({ data, message: 'Modules retrieved', statusCode: 200, status: 'Success' });
    }

    async reorder(req: Request, res: Response) {
        try {
            const { parentKey, sourceKey, targetKey, targetIndex } = req.body as {
                parentKey: string;
                sourceKey: string;
                targetKey?: string;
                targetIndex?: number;
            };
            const payload: { parentKey: string; sourceKey: string; targetKey?: string; targetIndex?: number } = { parentKey, sourceKey };
            if (typeof targetIndex === 'number') payload.targetIndex = targetIndex;
            if (typeof targetKey === 'string') payload.targetKey = targetKey;
            const updated = moduleService.reorder(payload);
            res.status(200).json({ data: updated, message: 'Reordered successfully', statusCode: 200, status: 'Success' });
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Bad request', statusCode: 400, status: 'Failed' });
        }
    }
}
