import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.util';
dotenv.config();

let client: MongoClient | null = null;
let db: Db | null = null;
let collection: Collection | null = null;

export const getMongoAuditCollection = async (): Promise<Collection> => {
    if (collection) return collection;

    const uri = process.env.MONGO_URI as string;
    const dbName = process.env.MONGO_DB as string;
    const collName = process.env.MONGO_AUDIT_COLLECTION || 'api_audit_logs';

    if (!uri || !dbName) {
        throw new Error('MONGO_URI or MONGO_DB is not defined in environment variables');
    }

    if (!client) {
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 3000,
        });
        await client.connect();
        Logger.success('Connected to MongoDB audit cluster');
    }

    if (!db) {
        db = client.db(dbName);
    }

    if (!collection) {
        collection = db.collection(collName);
        await collection.createIndex({ requestId: 1 }, { background: true });
        await collection.createIndex({ path: 1, method: 1 }, { background: true });
        await collection.createIndex({ statusCode: 1 }, { background: true });
        await collection.createIndex({ createdAt: 1 }, { background: true });
    }

    return collection;
};

