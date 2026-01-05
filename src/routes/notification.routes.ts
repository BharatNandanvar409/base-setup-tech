import express from 'express';
import { NotificationControllerClass } from '../controllers/notifications.controller';

const route = express.Router();
route.post('/send', NotificationControllerClass.sendNotification);

export default route;