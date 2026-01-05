import { Router } from 'express';
import { DestinationsController } from '../controllers/destinations.controller';
import { authMiddleware, isLoggedIn, requireAdmin } from '../middleware';
import { validate } from '../middleware/validator.middleware';
import { destinationCreateSchema, destinationUpdateSchema, destinationListSchema } from '../validators/destination.validator';

const router = Router();
const controller = new DestinationsController();

router.post('/', authMiddleware, isLoggedIn, requireAdmin, validate(destinationCreateSchema), controller.create.bind(controller));
router.put('/:id', authMiddleware, isLoggedIn, requireAdmin, validate(destinationUpdateSchema), controller.update.bind(controller));
router.delete('/:id', authMiddleware, isLoggedIn, requireAdmin, controller.remove.bind(controller));
router.get('/:id', authMiddleware, isLoggedIn, controller.get.bind(controller));
router.get('/', authMiddleware, isLoggedIn, validate(destinationListSchema), controller.list.bind(controller));
router.put('/reorder/swap', authMiddleware, isLoggedIn, requireAdmin, controller.reorderSwap.bind(controller));

export default router;
