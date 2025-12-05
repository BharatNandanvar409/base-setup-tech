import { IUser, Users } from "../models";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { GetAllUserQueryParamsDTO } from "../constant/basequery.param.dto";
import { Op } from "sequelize";

export class userService{
    async registerUser(userData:IUser){

        const { email, password, username} = userData;
        const userExistsAlready = await Users.findOne({ where: { 
            [Op.or]: [{ email }, { username }],
         } });
        if (userExistsAlready) {
            throw new Error('User already exists');
        }
        const encryptedPassword = await this.encryptPassword(password);
        const user = await Users.create(
            {
                email,
                username,
                password: encryptedPassword,
            }
        );
        return user;
    }


    async generateToken (user:any) {
        try {
            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, {
                expiresIn: '1h',
            });
            return token;
        } catch (error) {
            console.error('Failed to generate token:', (error as Error).message);
            process.exit(1);
        }
    }
    
    async encryptPassword (password: string) {
        try {
            const encryptedPassword = await bcrypt.hash(password, 10);
            return encryptedPassword;
        } catch (error) {
            console.error('Failed to encrypt password:', (error as Error).message);
            process.exit(1);
        }
    }
    

    async loginUser(email: string, password: string) {
        try {
            const user = await Users.findOne({ where: { email } });
            console.log("🚀 ~ userService ~ loginUser ~ user:", user?.dataValues?.password)
            if (!user) {
                return null;
            }
            const passwordMatch = await bcrypt.compare(password, user?.dataValues?.password);
            if (!passwordMatch) {
                return null;
            }
            return user;
        } catch (error) {
            console.error('Failed to login user:', (error as Error));
            return null;
        }
    }


    async getAllUser(queryParams: GetAllUserQueryParamsDTO){
        const { pageNum = 1, pageLimit = 10, search, sortField, sortOrder, name, gender, email, phone, username, role } = queryParams;
        const offset = ((Number(pageNum) - 1) * Number(pageLimit)) || 0;
        const limit = Number(pageLimit) || 10;
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC'; 
        const searchQuery = search || '';
        const where = {
            ...searchQuery ? 
            {
                [Op.or] :[
                    {
                        name: {
                            [Op.like]: `%${searchQuery}%`,
                        }
                    },
                    {
                        email: {
                            [Op.like]: `%${searchQuery}%`,
                        }
                    }
                ]
            }
            : {},

            // ...searchQuery ? { [Op.or]: [
            //     // { name: { [Op.like]: `%${searchQuery}%` } },
            //     { email: { [Op.like]: `%${searchQuery}%` } },
            //     // { phone: { [Op.like]: `%${searchQuery}%` } },
            //     { username: { [Op.like]: `%${searchQuery}%` } },
            // ] } : {},
            // name: {
            //     [Op.like]: `%${name}%`,
            // },
            // gender,
            ...email ? { email: {
                [Op.like]: `%${email}%`,
            } } : {},
            // phone: {
            //     [Op.like]: `%${phone}%`,
            // },
            ...username ? { username: {
                [Op.like]: `%${username}%`,
            } } : {},
            // role,
        };
        const { rows, count } = await Users.findAndCountAll({
            where,
            order: [[sortField || 'id', order]],
            offset,
            limit,
        });
        return {
            users: rows,
            page: pageNum,
            limit: limit,
            totalRecords: count
        };
    }
}