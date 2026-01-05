import { NextFunction, Request, Response } from "express"
import {GetAllProductQueryParamsDTO } from "../constant/basequery.param.dto"
import axios from "axios"
import { Products } from "../models/products.model"
import { generateProductKey } from "../utils"
import { Op } from "sequelize"

export class ProductsController{
    async getAllProducts (req: Request, res: Response, next: NextFunction){
        try {
            const queryParams: GetAllProductQueryParamsDTO = {
                name: req.query.name as string,
                price: req.query.price as string,
                category: req.query.category as string,
                pageNum: req.query.page as string || '1',
                pageLimit: req.query.limit as string || '10',
                sortField: req.query.sortField as string || 'createdAt',
                sortOrder: req.query.sortOrder as string || 'DESC',
            }

            const response = await axios.get("https://fakestoreapi.com/products", {
                params: queryParams,
            })

            // check for the sync here too
            const existingProducts = await Products.findAll({
                where: {
                    productKey: {
                        [Op.in]: response.data.map((item:any) => generateProductKey((item.title).toString(), (item.category).toString()))
                    }
                }
            })
            console.log("🚀 ~ ProductsController ~ getAllProducts ~ existingProducts:", existingProducts)
            for (let i =0; i< response.data.length && i< Number(queryParams?.pageLimit); i++) {
                const productKey = generateProductKey((response.data[i].title).toString(), (response.data[i].category).toString())
                console.log(`we are getting ${i} number of products and length would be ${response.data.length}`)
                console.log(existingProducts.find((item) => item.dataValues.productKey === productKey))
                if (existingProducts.find((item) => item.dataValues.productKey === productKey)) {
                    console.log(existingProducts.find((item) => item.productKey === productKey))
                    console.log(`product ${productKey} already exists`)
                    continue
                }
                await Products.create({
                    productKey: productKey,
                    title: (response.data[i].title).toString(),
                    price: Number(response.data[i].price),
                    category: (response.data[i].category).toString(),
                } as any)
            }
            return res.status(200).json({
                success: true,
                message: 'Products retrieved successfully',
                data: response.data,
            })
        } catch (error) {
            next(error)
        }
    }


    async resyncProducts (req: Request, res: Response, next: NextFunction){
        try {
            const queryParams: GetAllProductQueryParamsDTO = {
                name: req.query.name as string,
                price: req.query.price as string,
                category: req.query.category as string,
                pageNum: req.query.page as string || '1',
                pageLimit: req.query.limit as string || '150',
                sortField: req.query.sortField as string || 'createdAt',
                sortOrder: req.query.sortOrder as string || 'DESC',
            }

            const response = await axios.get("https://fakestoreapi.com/products", {
                params: queryParams,
            })
            for (let i =0; i< response.data.length && i< Number(queryParams?.pageLimit); i++) {
                const productKey = generateProductKey((response.data[i].title).toString(), (response.data[i].category).toString())
                const product = await Products.findOne({
                    where: {
                        productKey: productKey,
                    }
                })
                if (product) {
                    await Products.update({
                        reSync: true,
                    }, {
                        where: {
                            productKey: productKey,
                        }
                    })
                } else {
                    await Products.create({
                        productKey: productKey,
                        title: (response.data[i].title).toString(),
                        price: Number(response.data[i].price),
                        category: (response.data[i].category).toString(),
                    } as any)
                }
            }
            return res.status(200).json({
                success: true,
                message: 'Products resynced successfully',
            })

        } catch (error) {
            next(error)
        }
    }

    async checkNewProduct (req: Request, res: Response, next: NextFunction){
        try {
            const productKey = generateProductKey((req.body.title).toString(), (req.body.category).toString())
            console.log("🚀 ~ ProductsController ~ checkNewProduct ~ productKey:", productKey)
            const product = await Products.findOne({
                where: {
                    productKey: productKey.trim(),
                }
            })
            if (product) {
                return res.status(200).json({
                    success: true,
                    message: 'Product already exists',
                })
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Product does not exist',
                })
            }
        } catch (error) {
            next(error)
        }
    }
}