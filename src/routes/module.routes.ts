import { Router } from 'express';
import { ModuleController } from '../controllers/module.controller';
import { validate } from '../middleware/validator.middleware';
import { reorderSchema } from '../validators/module.validator';

const router = Router();
const controller = new ModuleController();

router.get('/', controller.getModules.bind(controller));
router.post('/reorder', validate(reorderSchema), controller.reorder.bind(controller));

export default router;

