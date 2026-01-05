import { Router } from 'express';
import { ItineraryController } from '../controllers/itinerary.controller';
import { authMiddleware, isLoggedIn } from '../middleware';
import { validate } from '../middleware/validator.middleware';
import { itineraryGenerateAutoSchema, itineraryGenerateManualSchema, itineraryAddActivitySchema, itineraryReorderSchema, itineraryUpdateDaySchema, itineraryUpdateActivitySchema } from '../validators/itinerary.validator';

const router = Router();
const controller = new ItineraryController();

router.post('/generate-auto', authMiddleware, isLoggedIn, validate(itineraryGenerateAutoSchema), controller.generateAuto.bind(controller));
router.post('/generate', authMiddleware, isLoggedIn, validate(itineraryGenerateManualSchema), controller.generateManual.bind(controller));
router.post('/day/:dayId/activities', authMiddleware, isLoggedIn, validate(itineraryAddActivitySchema), controller.addActivity.bind(controller));
router.put('/day/:dayId/activities/reorder', authMiddleware, isLoggedIn, validate(itineraryReorderSchema), controller.reorderActivities.bind(controller));
router.put('/day/:dayId', authMiddleware, isLoggedIn, validate(itineraryUpdateDaySchema), controller.updateDay.bind(controller));
router.put('/activity/:id', authMiddleware, isLoggedIn, validate(itineraryUpdateActivitySchema), controller.updateActivity.bind(controller));
router.delete('/activity/:id', authMiddleware, isLoggedIn, controller.deleteActivity.bind(controller));
router.get('/:tripId', authMiddleware, isLoggedIn, controller.getItinerary.bind(controller));

export default router;
