import { NextFunction, Request, Response } from 'express';
import { Orders, OrderItems, Products } from '../models';
import { sequelize } from '../config/database';
import { requestAsyncStore } from '../utils/request-context.util';
import { diffChangedFields } from '../utils/audit.util';

export class OrdersController {
    async auditDemo(req: Request, res: Response, _next: NextFunction) {
        const t = await sequelize.transaction();
        try {
            const product = await Products.create(
                {
                    title: 'Demo Product',
                    price: 100.0,
                    description: 'Initial description',
                    category: 'demo',
                    image: 'http://example.com/image.png',
                    productKey: 'demo-product-key',
                },
                { transaction: t }
            );

            const order = await Orders.create(
                {
                    orderNumber: `ORD-${Date.now()}`,
                    status: 'NEW',
                    total: 100.0,
                },
                { transaction: t }
            );

            const item = await OrderItems.create(
                {
                    orderId: order.id!,
                    productId: product.id!,
                    quantity: 1,
                    unitPrice: 100.0,
                },
                { transaction: t }
            );

            product.price = 120.0;
            await product.save({ transaction: t });

            item.quantity = 2;
            await item.save({ transaction: t });

            order.total = 240.0;
            order.status = 'UPDATED';
            await order.save({ transaction: t });

            await t.commit();
            return res.status(200).json({
                success: true,
                message: 'Audit demo executed; check latest audit log',
                orderId: order.id,
            });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({
                success: false,
                message: 'Audit demo failed',
                error: err.message,
            });
        }
    }

    async createOrder(req: Request, res: Response) {
        try {
            const order = await Orders.create({
                orderNumber: req.body.orderNumber || `ORD-${Date.now()}`,
                status: 'NEW',
                total: 0,
            });
            return res.status(201).json({ success: true, data: order });
        } catch (err: any) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async addItem(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { orderId, productId, quantity, unitPrice } = req.body;
            const item = await OrderItems.create({ orderId, productId, quantity, unitPrice }, { transaction: t });
            const total = await OrderItems.sum('unitPrice', { where: { orderId }, transaction: t }) as number;
            const qtySum = await OrderItems.sum('quantity', { where: { orderId }, transaction: t }) as number;
            const order = await Orders.findByPk(orderId, { transaction: t });
            if (order) {
                order.total = Number(total) * Number(qtySum);
                await order.save({ transaction: t });
            }
            await t.commit();
            return res.status(201).json({ success: true, data: item });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateItem(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { itemId, quantity, unitPrice } = req.body;
            const item = await OrderItems.findByPk(itemId, { transaction: t });
            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
            if (quantity !== undefined) item.quantity = Number(quantity);
            if (unitPrice !== undefined) item.unitPrice = Number(unitPrice);
            await item.save({ transaction: t });
            const total = await OrderItems.sum('unitPrice', { where: { orderId: item.dataValues.orderId }, transaction: t }) as number;
            const qtySum = await OrderItems.sum('quantity', { where: { orderId: item.dataValues.orderId }, transaction: t }) as number;
            const order = await Orders.findByPk(item.dataValues.orderId, { transaction: t });
            if (order) {
                order.total = Number(total) * Number(qtySum);
                await order.save({ transaction: t });
            }
            await t.commit();
            return res.status(200).json({ success: true, data: item });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateOrder(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { orderId, status } = req.body;
            const order = await Orders.findByPk(orderId, { transaction: t });
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            if (status) order.status = status;
            const total = await OrderItems.sum('unitPrice', { where: { orderId }, transaction: t }) as number;
            const qtySum = await OrderItems.sum('quantity', { where: { orderId }, transaction: t }) as number;
            order.total = Number(total) * Number(qtySum);
            await order.save({ transaction: t });
            await t.commit();
            return res.status(200).json({ success: true, data: order });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async removeItem(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { itemId } = req.body;
            const item = await OrderItems.findByPk(itemId, { transaction: t });
            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
            const orderId = item.orderId;
            await item.destroy({ transaction: t });
            const total = await OrderItems.sum('unitPrice', { where: { orderId }, transaction: t }) as number;
            const qtySum = await OrderItems.sum('quantity', { where: { orderId }, transaction: t }) as number;
            const order = await Orders.findByPk(orderId, { transaction: t });
            if (order) {
                order.total = Number(total || 0) * Number(qtySum || 0);
                await order.save({ transaction: t });
            }
            await t.commit();
            return res.status(200).json({ success: true });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteOrder(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { orderId } = req.body;
            const order = await Orders.findByPk(orderId, { transaction: t });
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            const items = await OrderItems.findAll({ where: { orderId }, transaction: t });
            for (const i of items) {
                await i.destroy({ transaction: t });
            }
            await order.destroy({ transaction: t });
            await t.commit();
            return res.status(200).json({ success: true });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async complexDemo(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { orderId, itemId, productId } = req.body;
            const product = await Products.findByPk(productId, { transaction: t });
            const item = await OrderItems.findByPk(itemId, { transaction: t });
            const order = await Orders.findByPk(orderId, { transaction: t });
            if (!product || !item || !order) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Entities not found' });
            }
            product.price = Number(product.price) + 10;
            await product.save({ transaction: t });
            item.quantity = Number(item.quantity) + 1;
            await item.save({ transaction: t });
            order.status = 'UPDATED';
            const total = await OrderItems.sum('unitPrice', { where: { orderId }, transaction: t }) as number;
            const qtySum = await OrderItems.sum('quantity', { where: { orderId }, transaction: t }) as number;
            order.total = Number(total) * Number(qtySum);
            await order.save({ transaction: t });
            await t.commit();
            return res.status(200).json({ success: true, message: 'Complex demo executed' });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateWithAuditPreview(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { orderId, itemId, productId, status, itemQuantityDelta = 1, productPriceDelta = 5 } = req.body;
            const order = await Orders.findByPk(orderId, { transaction: t });
            const item = await OrderItems.findByPk(itemId, { transaction: t });
            const product = await Products.findByPk(productId, { transaction: t });
            if (!order || !item || !product) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Entities not found' });
            }

            const prevOrder = order.toJSON();
            const prevItem = item.toJSON();
            const prevProduct = product.toJSON();

            if (status) order.status = status;
            item.quantity = Number(item.quantity) + Number(itemQuantityDelta);
            product.price = Number(product.price) + Number(productPriceDelta);

            await product.save({ transaction: t });
            await item.save({ transaction: t });

            const total = await OrderItems.sum('unitPrice', { where: { orderId }, transaction: t }) as number;
            const qtySum = await OrderItems.sum('quantity', { where: { orderId }, transaction: t }) as number;
            order.total = Number(total) * Number(qtySum);
            await order.save({ transaction: t });

            const nextOrder = order.toJSON();
            const nextItem = item.toJSON();
            const nextProduct = product.toJSON();

            await t.commit();

            const ctx = requestAsyncStore.getStore();
            const requestId = ctx?.requestId;

            const prev_data = {
                orders: [prevOrder],
                order_items: [prevItem],
                products: [prevProduct],
            };

            const update_data = {
                orders: [nextOrder],
                order_items: [nextItem],
                products: [nextProduct],
            };

            return res.status(200).json({
                success: true,
                message: 'Order updated with audit preview',
                preview: { prev_data, update_data },
                requestId,
            });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async multiUpdateWithChangedFields(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const { orderId, itemId, status, itemQuantityDelta = 1 } = req.body;
            const order = await Orders.findByPk(orderId, { transaction: t });
            const item = await OrderItems.findByPk(itemId, { transaction: t });
            if (!order || !item) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Entities not found' });
            }

            const prevOrder = order.toJSON();
            const prevItem = item.toJSON();

            if (status) order.status = status;
            item.quantity = Number(item.dataValues.quantity) + Number(itemQuantityDelta);

            await order.save({ transaction: t });
            await item.save({ transaction: t });

            const nextOrder = order.toJSON();
            const nextItem = item.toJSON();

            await t.commit();

            const ctx = requestAsyncStore.getStore();
            const requestId = ctx?.requestId;

            const prev_data = {
                orders: [prevOrder],
                order_items: [prevItem],
            };

            const update_data = {
                orders: [nextOrder],
                order_items: [nextItem],
            };

            const updated_fields = {
                orders: diffChangedFields(prevOrder, nextOrder),
                order_items: diffChangedFields(prevItem, nextItem),
            };

            return res.status(200).json({
                success: true,
                message: 'Multi model update executed with preview',
                preview: { prev_data, update_data, updated_fields },
                requestId,
            });
        } catch (err: any) {
            await t.rollback();
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

