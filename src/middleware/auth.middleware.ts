import { NextFunction, Response } from "express"
import { verifyToken } from "../utils/jwt"
import { JwtPayload } from "jsonwebtoken"

export const authMiddleware = async(req: any, res: Response, next: NextFunction) =>{
    const token = req.headers['authorization']?.split(' ')[2];
    if(!token){
        return res.status(401).json({message:'No token, authorization denied'})
    }
    try{
        const decoded = await verifyToken(token)
        req.user = decoded 
        next()
    }catch(err:any){
        console.error('Failed to verify token:', (err as Error).message);
        console.error('Failed to verify token:', (err as Error));
        res.status(401).json({message:err.message ||'Token is not valid'})
    }
}


export const isLoggedIn = (req: any, res: Response, next: NextFunction) =>{
    console.log("🚀 ~ isLoggedIn ~ req.user:", req.user)
    if(req.user){
        next()
    }else{
        res.status(401).json({message:'You are not logged in'})
    }
}