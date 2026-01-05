import { Router } from 'express';
import { TripsController } from '../controllers/trips.controller';
import { authMiddleware, isLoggedIn } from '../middleware';
import { validate } from '../middleware/validator.middleware';
import { tripCreateSchema, tripAddDestinationSchema, tripSetDatesSchema, tripNotesCompanionsSchema, tripUpdateStatusSchema } from '../validators/trip.validator';

const router = Router();
const controller = new TripsController();

router.post('/', authMiddleware, isLoggedIn, validate(tripCreateSchema), controller.createTrip.bind(controller));
router.post('/add-destination', authMiddleware, isLoggedIn, validate(tripAddDestinationSchema), controller.addDestination.bind(controller));
router.put('/set-dates', authMiddleware, isLoggedIn, validate(tripSetDatesSchema), controller.setDates.bind(controller));
router.put('/notes-companions', authMiddleware, isLoggedIn, validate(tripNotesCompanionsSchema), controller.addNotesCompanions.bind(controller));
router.put('/status', authMiddleware, isLoggedIn, validate(tripUpdateStatusSchema), controller.updateStatus.bind(controller));
router.get('/:id', authMiddleware, isLoggedIn, controller.getTrip.bind(controller));
router.get('/', authMiddleware, isLoggedIn, controller.listTrips.bind(controller));

export default router;

