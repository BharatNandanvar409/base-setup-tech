import { Router } from 'express';
import { AuditLog } from '../models';

const router = Router();

router.get('/latest', async (_req, res) => {
    try {
        const log = await AuditLog.findOne({
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ success: true, data: log });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/list', async (req, res) => {
    try {
        const limit = Number(req.query.limit || 10);
        const logs = await AuditLog.findAll({
            order: [['createdAt', 'DESC']],
            limit,
        });
        res.status(200).json({ success: true, data: logs });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/by-request/:id', async (req, res) => {
    try {
        const log = await AuditLog.findOne({
            where: { requestId: req.params.id },
        });
        res.status(200).json({ success: true, data: log });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
