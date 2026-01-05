import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';

const router = Router();
const controller = new OrdersController();

router.post('/audit-demo', controller.auditDemo.bind(controller));
router.post('/create', controller.createOrder.bind(controller));
router.post('/add-item', controller.addItem.bind(controller));
router.put('/update-item', controller.updateItem.bind(controller));
router.put('/update-order', controller.updateOrder.bind(controller));
router.delete('/remove-item', controller.removeItem.bind(controller));
router.delete('/delete-order', controller.deleteOrder.bind(controller));
router.post('/complex-demo', controller.complexDemo.bind(controller));
router.post('/update-with-audit-preview', controller.updateWithAuditPreview.bind(controller));
router.post('/multi-update-with-fields', controller.multiUpdateWithChangedFields.bind(controller));

export default router;
