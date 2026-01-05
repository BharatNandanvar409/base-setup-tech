import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
class FirebaseMessagingService {
    private static instance: FirebaseMessagingService;
    private constructor() {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                } as any),
            });
        }
    }
    static getInstance(): FirebaseMessagingService {
        if (!this.instance) {
            this.instance = new FirebaseMessagingService();
        }
        return this.instance;
    }
    async sendToToken(
        token: string,
        title: string,
        body: string,
        data?: Record<string, string>
    ) {
        const message: any = {
            token,
            notification: {
                title,
                body,
            },
            data,
        };

        return admin.messaging().send(message);
    }
}

export const firebaseMessagingService =
    FirebaseMessagingService.getInstance();
