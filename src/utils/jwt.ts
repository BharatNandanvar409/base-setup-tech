import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { IUser } from '../models'
dotenv.config()
export const generateToken = async (user: IUser) => {
    const token = jwt.sign({ user }, process.env.JWT_SECRET as string || "SomethingSecret", {
        expiresIn: '1d'
    })
    return token
}

export const verifyToken = async (token: string) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || "SomethingSecret")
    return decoded;
}

export const decodeToken = async (token: string) => {
    const decoded = jwt.decode(token)
    return decoded
}