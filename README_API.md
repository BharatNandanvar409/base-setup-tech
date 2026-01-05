# Travel Buddy API Reference

## Auth
- POST `/auth/register` body: `{ email, username, password, cnf_password, role? }`
- POST `/auth/login` body: `{ email, password }`

## User Preferences
- GET `/preferences/me` (Bearer token)
- POST `/preferences/upsert` (Bearer token) body: `{ budgetMin?, budgetMax?, travelType?, preferredDestinations?, foodInterests?, activityInterests? }`
- DELETE `/preferences/delete` (Bearer token)

## Destinations (Admin CRUD)
- POST `/destinations` (Bearer admin) body: `{ country, city, bestTimeToVisit?, avgCost?, activities?, safetyScore?, metadata? }`
- PUT `/destinations/:id` (Bearer admin) body: partial fields
- DELETE `/destinations/:id` (Bearer admin)
- GET `/destinations/:id` (Bearer)
- GET `/destinations` (Bearer) query: `country?, city?, activities?, minCost?, maxCost?, safetyMin?, safetyMax?, search?, page?, limit?`

## Orders (Audit Demo)
- POST `/orders/create` body: `{ orderNumber? }`
- POST `/orders/add-item` body: `{ orderId, productId, quantity, unitPrice }`
- PUT `/orders/update-item` body: `{ itemId, quantity?, unitPrice? }`
- PUT `/orders/update-order` body: `{ orderId, status? }`
- POST `/orders/update-with-audit-preview` body: `{ orderId, itemId, productId, status?, itemQuantityDelta?, productPriceDelta? }`
- Audit inspection: `GET /audit/latest`, `GET /audit/list?limit=20`, `GET /audit/by-request/:id`

## Trip Planning
- POST `/trips` (Bearer) body: `{ startDate, endDate, status?, notes?, companions?, destinationIds? }`
- POST `/trips/add-destination` (Bearer) body: `{ tripId, destinationId, order? }`
- PUT `/trips/set-dates` (Bearer) body: `{ tripId, startDate, endDate }`
- PUT `/trips/notes-companions` (Bearer) body: `{ tripId, notes?, companions? }`
- PUT `/trips/status` (Bearer) body: `{ tripId, status }`
- GET `/trips/:id` (Bearer)
- GET `/trips` (Bearer)

## Itinerary Management
- POST `/itinerary/generate-auto` (Bearer) body: `{ tripId }`
- POST `/itinerary/generate` (Bearer) body: `{ tripId, days: [{ date, notes? }] }`
- POST `/itinerary/day/:dayId/activities` (Bearer) body: `{ title, timeStart?, timeEnd?, order?, notes? }`
- PUT `/itinerary/day/:dayId/activities/reorder` (Bearer) body: `{ orders: [{ activityId, order }] }`
- PUT `/itinerary/day/:dayId` (Bearer) body: `{ notes?, date? }`
- PUT `/itinerary/activity/:id` (Bearer) body: `{ title?, timeStart?, timeEnd?, order?, notes? }`
- DELETE `/itinerary/activity/:id` (Bearer)
- GET `/itinerary/:tripId` (Bearer)

## Swagger
- Open `http://localhost:PORT/api-docs` for full documentation
- Swagger source: `src/swagger/swagger.json`
