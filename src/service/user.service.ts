import { IUser, Users } from "../models";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { GetAllUserQueryParamsDTO } from "../constant/basequery.param.dto";
import { Op } from "sequelize";

export class userService {
    async registerUser(userData: any) {

        const { email, password, username, cnf_password, role = 'user' } = userData;
        if (password !== cnf_password) {
            throw new Error('Passwords must match');
        }
        const userExistsAlready = await Users.findOne({
            where: {
                [Op.or]: [{ email }, { username }],
            }
        });
        if (userExistsAlready) {
            throw new Error('User already exists');
        }
        const encryptedPassword = await this.encryptPassword(password);
        const user = await Users.create(
            {
                email,
                username,
                password: encryptedPassword,
                role,
            }
        );
        return user;
    }


    async generateToken(user: any) {
        try {
            console.log(user)
            const token = jwt.sign({ userId: user.id, email: user.dataValues.email, role: user.dataValues.role }, process.env.JWT_SECRET as string || "SomethingSecret", {
                expiresIn: '1h',
            });
            return token;
        } catch (error) {
            throw new Error(`Failed to generate token: ${(error as Error).message}`);
        }
    }

    async encryptPassword(password: string) {
        try {
            const encryptedPassword = await bcrypt.hash(password, 10);
            return encryptedPassword;
        } catch (error) {
            throw new Error(`Failed to encrypt password: ${(error as Error).message}`);
        }
    }


    async loginUser(email: string, password: string) {
        try {
            const user = await Users.findOne({ where: { email } });
            if (!user) {
                return null;
            }
            const passwordMatch = await bcrypt.compare(password, user?.dataValues?.password);
            if (!passwordMatch) {
                return null;
            }
            return user;
        } catch (error) {
            throw new Error(`Failed to login user: ${(error as Error).message}`);
        }
    }


    async getAllUser(queryParams: GetAllUserQueryParamsDTO) {
        const { pageNum = 1, pageLimit = 10, search, sortField, sortOrder, name, gender, email, phone, username, role } = queryParams;
        const offset = ((Number(pageNum) - 1) * Number(pageLimit)) || 0;
        const limit = Number(pageLimit) || 10;
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
        const searchQuery = search || '';
        const where = {
            ...searchQuery ?
                {
                    [Op.or]: [
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
            ...email ? {
                email: {
                    [Op.like]: `%${email}%`,
                }
            } : {},
            // phone: {
            //     [Op.like]: `%${phone}%`,
            // },
            ...username ? {
                username: {
                    [Op.like]: `%${username}%`,
                }
            } : {},
            // role,
        };
        const { rows, count } = await Users.findAndCountAll({
            where,
            attributes:[
                'id',
                'username',
                'email',
                'role'
            ],
            order: [[sortField || 'id', order]],
            offset,
            limit
        });
        return {
            users: rows,
            page: pageNum,
            limit: limit,
            totalRecords: count
        };
    }


    async countAllUser() {
        const count = await Users.count();
        console.log(count);
        return count;
    }
}
