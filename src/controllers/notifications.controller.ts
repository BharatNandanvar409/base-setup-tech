import { Request, Response } from 'express';
import { firebaseMessagingService } from '../utils';


export class NotificationControllerClass {
    static async sendNotification(req: Request, res: Response) {
        try {
            const { token, title, body, data } = req.body;
            const response = await firebaseMessagingService.sendToToken(
                token,
                'Test Notification',
                'Firebase backend setup successful 🚀',
                {
                    type: 'TEST',
                }
            );
            return res.status(200).json({
                message: 'Notification sent successfully',
                response,
            });
        } catch (error: any) {
            console.error('FCM Error:', error);
            return res.status(500).json({
                message: 'Failed to send notification',
                error: error.message,
            });
        }
    }

    sendNotification = async({ token, title, body, data }: { token: string, title: string, body: string, data: any }) => {
        try {
            const response = await firebaseMessagingService.sendToToken(
                token,
                title,
                body,
                // data
            );
            return response;
        } catch (error: any) {
            console.error('FCM Error:', error);
        }
    }
}