import { Router } from 'express';
import { LabelController } from '../controllers/label.controller';
import { authMiddleware, isLoggedIn } from '../middleware';
import { validate } from '../middleware/validator.middleware';
import { labelCreateSchema, labelUpdateSchema, assignLabelSchema } from '../validators/label.validator';

const router = Router();
const controller = new LabelController();

// Label CRUD operations
router.post('/', authMiddleware, isLoggedIn, validate(labelCreateSchema), controller.create.bind(controller));
router.get('/', authMiddleware, isLoggedIn, controller.list.bind(controller));
router.get('/:id', authMiddleware, isLoggedIn, controller.get.bind(controller));
router.patch('/:id', authMiddleware, isLoggedIn, validate(labelUpdateSchema), controller.update.bind(controller));
router.delete('/:id', authMiddleware, isLoggedIn, controller.delete.bind(controller));

export default router;
