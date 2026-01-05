import { Router } from 'express';
import { PreferencesController } from '../controllers/preferences.controller';
import { authMiddleware, isLoggedIn } from '../middleware';
import { validate } from '../middleware/validator.middleware';
import { preferencesSchema } from '../validators/preferences.validator';

const router = Router();
const controller = new PreferencesController();

router.get('/me', authMiddleware, isLoggedIn, controller.getMyPreferences.bind(controller));
router.post('/upsert', authMiddleware, isLoggedIn, validate(preferencesSchema), controller.upsertPreferences.bind(controller));
router.delete('/delete', authMiddleware, isLoggedIn, controller.deletePreferences.bind(controller));

export default router;

