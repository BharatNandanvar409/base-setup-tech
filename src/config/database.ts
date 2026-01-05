import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import {
    Products, Users, AuditLog, Orders, OrderItems, Destinations, UserPreferences,
    Trips, TripDestinations, Itineraries, ItineraryDays, ItineraryActivities,
    MaterialRequest, PurchaseRequest, PurchaseQuotes, PurchaseOrder,
    ProformaInvoice, Container, PackagingList, CommercialInvoice,
    TaskBoard, TaskStatusHistory, Labels, TaskLabels,
    TaskAssignedUsers
} from '../models';
dotenv.config();


export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Sit123',
    database: 'dev',
    models: [
        Users, Products, Orders, OrderItems, Destinations, UserPreferences,
        Trips, TripDestinations, Itineraries, ItineraryDays, ItineraryActivities, AuditLog,
        MaterialRequest, PurchaseRequest, PurchaseQuotes, PurchaseOrder,
        ProformaInvoice, Container, PackagingList, CommercialInvoice,
        TaskBoard, TaskStatusHistory, Labels, TaskLabels, TaskAssignedUsers
    ],
    logging: true,
});
