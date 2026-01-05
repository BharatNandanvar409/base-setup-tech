import { NextFunction, Request, Response } from 'express';
import { Destinations } from '../models';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

export class DestinationsController {
    async create(req: Request, res: Response) {
        try {
            const body = req.body as any;
            if (body.orderIndex === undefined) {
                const maxOrder = await Destinations.max('orderIndex') as number | null;
                body.orderIndex = (Number(maxOrder) || 0) + 1;
            }
            const created = await Destinations.create(body);
            res.status(201).json({ success: true, data: created, statusCode: 201, status: "Success" });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const dest = await Destinations.findByPk(id);
            if (!dest) return res.status(404).json({ success: false, message: 'Destination not found' });
            dest.set(req.body);
            await dest.save();
            res.status(200).json({ success: true, data: dest, statusCode: 200, status: "Success" });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async remove(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const dest = await Destinations.findByPk(id);
            if (!dest) return res.status(404).json({ success: false, message: 'Destination not found' });
            await dest.destroy();
            res.status(200).json({ success: true });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async get(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const dest = await Destinations.findByPk(id);
            if (!dest) return res.status(404).json({ success: false, message: 'Destination not found', statusCode: 404, status: "Error" });
            res.status(200).json({ success: true, data: dest, statusCode: 200, status: "Success" });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const { country, city, activities, minCost, maxCost, safetyMin, safetyMax, search, page = '1', limit = '10' } = req.query as any;
            const where: any = {};
            if (country) where.country = { [Op.iLike]: `%${country}%` };
            if (city) where.city = { [Op.iLike]: `%${city}%` };
            if (minCost || maxCost) where.avgCost = {};
            if (minCost) where.avgCost[Op.gte] = Number(minCost);
            if (maxCost) where.avgCost[Op.lte] = Number(maxCost);
            if (safetyMin || safetyMax) where.safetyScore = {};
            if (safetyMin) where.safetyScore[Op.gte] = Number(safetyMin);
            if (safetyMax) where.safetyScore[Op.lte] = Number(safetyMax);
            if (activities) where.activities = { [Op.contains]: Array.isArray(activities) ? activities : [activities] };
            if (search) {
                where[Op.or] = [
                    { country: { [Op.iLike]: `%${search}%` } },
                    { city: { [Op.iLike]: `%${search}%` } },
                    { bestTimeToVisit: { [Op.iLike]: `%${search}%` } },
                ];
            }
            const pageNum = Number(page);
            const pageLimit = Number(limit);
            const { rows, count } = await Destinations.findAndCountAll({
                where,
                order: [['orderIndex', 'ASC'], ['createdAt', 'ASC']],
                offset: (pageNum - 1) * pageLimit,
                limit: pageLimit,
            });
            res.status(200).json({ success: true, data: rows, total: count, totalPages: Math.ceil(count / pageLimit), page: pageNum, limit: pageLimit, statusCode: 200, status: "Success" });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async reorderSwap(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { idA, idB } = req.body as any;
            if (!idA || !idB) {
                await t.rollback();
                return res.status(400).json({ success: false, message: 'idA and idB are required' });
            }
            const a = await Destinations.findByPk(idA, { transaction: t });
            const b = await Destinations.findByPk(idB, { transaction: t });
            if (!a || !b) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Destination(s) not found' });
            }
            const aOrder = a.dataValues.orderIndex || 0;
            const bOrder = b.dataValues.orderIndex || 0;
            a.set({ orderIndex: bOrder });
            b.set({ orderIndex: aOrder });
            await a.save({ transaction: t });
            await b.save({ transaction: t });
            await t.commit();
            return res.status(200).json({ success: true, data: { a, b }, statusCode: 200, status: "Success" });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
