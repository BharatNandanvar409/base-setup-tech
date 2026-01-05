import { NextFunction, Request, Response } from 'express';
import { Trips, TripDestinations, Destinations } from '../models';
import { sequelize } from '../config/database';

export class TripsController {
    async createTrip(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const userId = (req as any).user?.userId || (req as any).user?.user?.id;
            const { startDate, endDate, status = 'planned', notes, companions = [], destinationIds = [] } = req.body;
            const trip = await Trips.create(
                {
                    userId,
                    status,
                    startDate,
                    endDate,
                    durationDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
                    notes,
                    companions,
                },
                { transaction: t }
            );
            for (let i = 0; i < destinationIds.length; i++) {
                await TripDestinations.create({ tripId: trip.id!, destinationId: destinationIds[i], order: i + 1 }, { transaction: t });
            }
            await t.commit();
            res.status(201).json({ success: true, data: trip });
        } catch (err: any) {
            await t.rollback();
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async addDestination(req: Request, res: Response) {
        try {
            const { tripId, destinationId, order } = req.body;
            const td = await TripDestinations.create({ tripId, destinationId, order });
            res.status(201).json({ success: true, data: td });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async setDates(req: Request, res: Response) {
        try {

            const { tripId, startDate, endDate } = req.body;
            const trip = await Trips.findByPk(tripId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            trip.startDate = new Date(startDate);
            trip.endDate = new Date(endDate);
            trip.durationDays = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            trip.set({ startDate, endDate, durationDays: trip.durationDays });
            await trip.save();
            res.status(200).json({ success: true, data: trip });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async addNotesCompanions(req: Request, res: Response) {
        try {
            const { tripId, notes, companions } = req.body;
            const trip = await Trips.findByPk(tripId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            trip.notes = notes ?? trip.notes;
            trip.companions = companions ?? trip.companions;
            trip.set({ notes, companions });
            await trip.save();
            res.status(200).json({ success: true, data: trip });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            // instead of the save use set to update the dates
            const { tripId, status } = req.body;
            const trip = await Trips.findByPk(tripId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            trip.status = status;
            trip.set({ status });
            await trip.save();
            res.status(200).json({ success: true, data: trip });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getTrip(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const trip = await Trips.findByPk(id, {
                include: [{ model: TripDestinations, include: [Destinations] }],
            });
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            res.status(200).json({ success: true, data: trip });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async listTrips(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId || (req as any).user?.user?.id;
            const trips = await Trips.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
            });
            res.status(200).json({ success: true, data: trips, total: trips.length, totalPages: Math.ceil(trips.length / 10), page: 1, limit: 10, statusCode: 200, status: "Success" });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

