
import http from 'http';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'
import dotenv from 'dotenv';
import app from './app';
// import pool from './config/database';
dotenv.config();
const PORT = process.env.PORT || 3000;


const server = http.createServer(app);

const startServer = async () => {
    try {
        // await pool.query("Select now()")
        console.log('PostgreSQL connection verified');

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', (error as Error).message);
        process.exit(1);
    }
}

startServer()