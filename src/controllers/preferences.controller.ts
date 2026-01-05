import { NextFunction, Request, Response } from 'express';
import { UserPreferences } from '../models';

export class PreferencesController {
    async getMyPreferences(req: Request, res: Response, _next: NextFunction) {
        try {
            const userId = (req as any).user?.userId || (req as any).user?.user?.id;
            const prefs = await UserPreferences.findOne({ where: { userId } });
            res.status(200).json({ success: true, data: prefs });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // async upsertPreferences(req: Request, res: Response) {
    //     try {
    //         const userId = (req as any).user?.userId || (req as any).user?.user?.id;
    //         const existing = await UserPreferences.findOne({ where: { userId } });
    //         console.log(req.body)
    //         console.log(req.body.preferredDestinations)
    //         if (existing) {
    //             existing.budgetMin = req.body.budgetMin ?? existing.budgetMin;
    //             existing.budgetMax = req.body.budgetMax ?? existing.budgetMax;
    //             existing.travelType = req.body.travelType ?? existing.travelType;
    //             existing.preferredDestinations = req.body.preferredDestinations ?? existing.preferredDestinations;
    //             existing.foodInterests = req.body.foodInterests ?? existing.foodInterests;
    //             existing.activityInterests = req.body.activityInterests ?? existing.activityInterests;
    //             await existing.save();
    //             return res.status(200).json({ success: true, data: existing });
    //         } else {
    //             const created = await UserPreferences.create({ userId, ...req.body });
    //             return res.status(201).json({ success: true, data: created });
    //         }
    //     } catch (err: any) {
    //         res.status(500).json({ success: false, message: err.message });
    //     }
    // }
    async upsertPreferences(req: Request, res: Response) {
        try {
            const userId =
                (req as any).user?.userId ||
                (req as any).user?.user?.id;
            console.log("🚀 ~ PreferencesController ~ upsertPreferences ~ userId:", userId)

            const existing = await UserPreferences.findOne({
                where: { userId }
            });

            if (existing) {
                existing.set(req.body);  
                await existing.save();

                return res.status(200).json({
                    success: true,
                    data: existing
                });
            }

            const created = await UserPreferences.create({
                userId,
                ...req.body
            });

            return res.status(201).json({
                success: true,
                data: created
            });

        } catch (err: any) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }


    async deletePreferences(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId || (req as any).user?.user?.id;
            const prefs = await UserPreferences.findOne({ where: { userId } });
            if (!prefs) return res.status(404).json({ success: false, message: 'Preferences not found' });
            await prefs.destroy();
            res.status(200).json({ success: true });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

