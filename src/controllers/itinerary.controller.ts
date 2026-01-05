import { NextFunction, Request, Response } from 'express';
import { Itineraries, ItineraryDays, ItineraryActivities, Trips } from '../models';
import { sequelize } from '../config/database';

export class ItineraryController {
    async generateAuto(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { tripId } = req.body;
            const trip = await Trips.findByPk(tripId, { transaction: t });
            if (!trip) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Trip not found' });
            }
            const itin = await Itineraries.create({ tripId, revision: 1 }, { transaction: t });
            const days: ItineraryDays[] = [];
            const start = new Date(trip.startDate);
            for (let i = 0; i < (trip.durationDays || 1); i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const day = await ItineraryDays.create({ itineraryId: itin.id!, dayIndex: i + 1, date: d }, { transaction: t });
                days.push(day);
            }
            await t.commit();
            res.status(201).json({ success: true, data: { itinerary: itin, days } });
        } catch (err: any) {
            await t.rollback();
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async generateManual(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { tripId, days } = req.body;
            const itin = await Itineraries.create({ tripId, revision: 1 }, { transaction: t });
            const createdDays: ItineraryDays[] = [];
            for (let i = 0; i < days.length; i++) {
                const day = await ItineraryDays.create({ itineraryId: itin.id!, dayIndex: i + 1, date: new Date(days[i].date), notes: days[i].notes }, { transaction: t });
                createdDays.push(day);
            }
            await t.commit();
            res.status(201).json({ success: true, data: { itinerary: itin, days: createdDays } });
        } catch (err: any) {
            await t.rollback();
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async addActivity(req: Request, res: Response) {
        try {
            const dayId = req.params.dayId as string;
            const { title, timeStart, timeEnd, order, notes } = req.body;
            const act = await ItineraryActivities.create({ dayId, title, timeStart, timeEnd, order, notes });
            res.status(201).json({ success: true, data: act });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async reorderActivities(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const dayId = req.params.dayId;
            const { orders } = req.body;
            for (const o of orders) {
                const act = await ItineraryActivities.findByPk(o.activityId, { transaction: t });
                if (act) {
                    act.order = o.order;
                    await act.save({ transaction: t });
                }
            }
            await t.commit();
            res.status(200).json({ success: true });
        } catch (err: any) {
            await t.rollback();
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateDay(req: Request, res: Response) {
        try {
            const dayId = req.params.dayId;
            const { notes, date } = req.body;
            const day = await ItineraryDays.findByPk(dayId);
            if (!day) return res.status(404).json({ success: false, message: 'Day not found' });
            day.notes = notes ?? day.notes;
            if (date) {
                day.date = new Date(date);
            }
            await day.save();
            res.status(200).json({ success: true, data: day });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateActivity(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const act = await ItineraryActivities.findByPk(id);
            if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });
            const { title, timeStart, timeEnd, order, notes } = req.body;
            act.title = title ?? act.title;
            act.timeStart = timeStart ?? act.timeStart;
            act.timeEnd = timeEnd ?? act.timeEnd;
            act.order = order ?? act.order;
            act.notes = notes ?? act.notes;
            await act.save();
            res.status(200).json({ success: true, data: act });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteActivity(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const act = await ItineraryActivities.findByPk(id);
            if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });
            await act.destroy();
            res.status(200).json({ success: true });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getItinerary(req: Request, res: Response) {
        try {
            const tripId = req.params.tripId;
            const itin = await Itineraries.findOne({ where: { tripId }, include: [{ model: ItineraryDays, include: [ItineraryActivities] }] });
            res.status(200).json({ success: true, data: itin });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}
