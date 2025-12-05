import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { Users } from '../models';
import { Dialect } from 'sequelize';
dotenv.config();

console.log(process.env.PG_HOST);
console.log(process.env.PG_PASSWORD);
console.log(process.env.PG_USER);
console.log(process.env.PG_DATABASE);

export const sequelize = new Sequelize({
    dialect: process.env.PG_DIALECT as Dialect,
    host: process.env.PG_HOST as string ,
    port: Number(process.env.PG_PORT as string), 
    username: process.env.PG_USER as string,
    password: process.env.PG_PASSWORD as string, 
    database: process.env.PG_DATABASE as string,
    models: [Users],
    logging: true,
});

