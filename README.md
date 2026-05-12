# Car Rental Platform

A full-stack car rental application where users can browse, book, and manage luxury vehicles, while owners can list and manage their cars. Built with React, Express, MongoDB, and ImageKit, the platform features secure authentication, booking management, car availability tracking, and responsive UI.

## Features

- User registration, login, and secure JWT authentication
- Car listing, image upload, and owner dashboard
- Search, filter, and book cars with real-time availability
- Manage bookings, confirm/cancel requests, and track status
- Responsive design using React and Tailwind CSS
- Redis caching for core read endpoints
- Background jobs with BullMQ (booking expiry, analytics, notifications)
- Stripe Checkout payments with webhook confirmation
- Real-time owner notifications via Socket.IO

## Tech Stack

- Frontend: React, Tailwind CSS, Axios, Vite
- Backend: Express, MongoDB, Mongoose, JWT, Multer, ImageKit, Redis, BullMQ, Socket.IO, Stripe
  
## Images
<img width="1919" height="1041" alt="image" src="https://github.com/user-attachments/assets/b2b56c25-c4d9-4c1a-9eea-57f9c5141332" />
<img width="1864" height="1042" alt="image" src="https://github.com/user-attachments/assets/6e8e8c82-ec54-4b5f-900b-bbbc20d0ed24" />
<img width="1919" height="1040" alt="image" src="https://github.com/user-attachments/assets/f7dd7cc7-c24c-461f-8b2c-fd37235dc255" />


## Getting Started

1. Clone the repository
2. Install dependencies in both `client` and `server` folders
3. Set up environment variables (see `server/.env.example`)
4. Start Redis (local or hosted)
5. Run the backend (`npm run server` in `/server`)
6. Run the worker (`node server/workers/bookingWorker.js` in `/server`)
7. Run the frontend (`npm run dev` in `/client`)

## Stripe Setup

1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `server/.env`
2. Set `CLIENT_URL` for redirect URLs
3. Run Stripe webhook listener:

```bash
stripe listen --forward-to http://localhost:3000/api/payments/webhook
```

## Redis Setup

- Provide `REDIS_URL` (example: `redis://localhost:6379`)
- Redis is required for caching and background jobs

## Worker Commands

```bash
node server/workers/bookingWorker.js
```

## Socket Architecture

- Owners join private rooms: `owner:{ownerId}`
- Events: `newBooking`, `bookingConfirmed`, `bookingCancelled`, `paymentSuccessful`, `availabilityUpdated`

## License

MIT
