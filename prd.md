# PRD — Scalable Real-Time Backend Upgrade with Stripe Payments

## MERN Car Rental Platform

---

# 1. Objective

Upgrade the existing MERN car rental platform into a scalable, production-style architecture by adding:

* Redis caching
* Background job queues
* Real-time WebSocket communication
* Persistent notifications
* Centralized error handling
* Validation middleware
* Stripe payment gateway integration

The upgraded backend should demonstrate:

* scalable architecture,
* event-driven workflows,
* async processing,
* secure payment handling,
* production-grade backend engineering practices.

---

# 2. Existing System Context

Current platform already supports:

* JWT authentication
* Car listings
* Booking creation
* Owner dashboard
* Car management
* Booking management
* MongoDB persistence

Current limitations:

* No payment workflow
* No real-time updates
* No async job handling
* All requests directly hit MongoDB
* No caching layer
* No persistent notification system

---

# 3. Core Features To Implement

---

# FEATURE 1 — Redis Caching Layer

## Goal

Reduce MongoDB load and improve API response times.

---

## Tech Stack

* Redis
* node-redis

---

## Endpoints To Cache

| Endpoint                         | Cache Key             | TTL |
| -------------------------------- | --------------------- | --- |
| /api/user/cars                   | cars                  | 60s |
| /api/owner/dashboard             | dashboard:${ownerId}  | 30s |
| /api/bookings/check-availability | availability:${query} | 60s |

---

## Requirements

### Cache Hit

* Return Redis response directly.

### Cache Miss

* Query MongoDB
* Store response in Redis
* Return response

---

## Cache Invalidation

Invalidate cache on:

* booking creation,
* booking cancellation,
* car creation,
* car deletion,
* availability updates.

---

## Required File

```text id="jlwm74"
/configs/redis.js
```

---

# FEATURE 2 — Background Job Queue System

## Goal

Move expensive operations outside request-response cycle.

---

## Tech Stack

* BullMQ
* Redis

---

## Queue Name

```text id="jlwm75"
bookingQueue
```

---

## Required Jobs

| Job                  | Purpose                     |
| -------------------- | --------------------------- |
| sendBookingEmail     | Booking confirmation email  |
| notifyOwner          | Owner notification          |
| expirePendingBooking | Auto-cancel unpaid bookings |
| analyticsUpdate      | Dashboard refresh           |

---

## Queue Architecture

### Producer

Located in:

```text id="jlwm76"
bookingController.js
```

### Worker

Create:

```text id="jlwm77"
/workers/bookingWorker.js
```

---

## Retry Policy

| Setting  | Value       |
| -------- | ----------- |
| Attempts | 3           |
| Backoff  | Exponential |

---

# FEATURE 3 — Real-Time Notification System

## Goal

Provide live updates without page refresh.

---

## Tech Stack

* Socket.IO

---

## Socket Requirements

### Room-Based Architecture

Each owner joins private room:

```text id="jlwm78"
owner:${ownerId}
```

---

## Required Events

| Event               | Description          |
| ------------------- | -------------------- |
| newBooking          | Booking created      |
| bookingConfirmed    | Booking approved     |
| bookingCancelled    | Booking cancelled    |
| paymentSuccessful   | Payment completed    |
| availabilityUpdated | Availability changed |

---

## Real-Time Flow

```text id="jlwm79"
Booking Created
→ Payment Completed
→ Queue Jobs Added
→ Socket Event Emitted
→ Owner Dashboard Updates Instantly
```

---

## Frontend Requirements

Create:

```text id="jlwm7a"
/src/socket.js
```

Responsibilities:

* initialize socket connection,
* export reusable socket instance.

---

# FEATURE 4 — Persistent Notification System

## Goal

Store notifications for history and unread tracking.

---

## Collection

```text id="jlwm7b"
notifications
```

---

## Notification Schema

```js id="jlwm7c"
{
  user: ObjectId,
  message: String,
  type: String,
  read: Boolean,
  createdAt: Date
}
```

---

## APIs

### Fetch Notifications

```text id="jlwm7d"
GET /api/notifications
```

---

### Mark Notification Read

```text id="jlwm7e"
POST /api/notifications/read
```

---

## Frontend Requirements

Add:

* notification bell,
* unread count,
* dropdown list.

---

# FEATURE 5 — Stripe Payment Gateway Integration

## Goal

Introduce secure online payment workflow before booking confirmation.

---

## Tech Stack

* Stripe
* Stripe Checkout Session API
* Stripe Webhooks

---

# Payment Flow

```text id="jlwm7f"
User Selects Car
→ Booking Created With "pending_payment"
→ Stripe Checkout Session Created
→ User Completes Payment
→ Stripe Webhook Triggered
→ Booking Marked Confirmed
→ Notifications Sent
→ Availability Updated
```

---

# Booking Statuses

Update booking schema statuses:

| Status          |
| --------------- |
| pending_payment |
| confirmed       |
| cancelled       |
| expired         |

---

# Required APIs

---

## 1. Create Checkout Session

```text id="jlwm7g"
POST /api/payments/create-checkout-session
```

### Responsibilities

* validate booking,
* calculate total amount,
* create Stripe checkout session,
* return checkout URL/sessionId.

---

## 2. Stripe Webhook Endpoint

```text id="jlwm7h"
POST /api/payments/webhook
```

### Responsibilities

* verify Stripe signature,
* confirm payment,
* update booking status,
* trigger notifications,
* invalidate Redis cache,
* emit socket events,
* enqueue background jobs.

---

# Required Stripe Metadata

Store:

* bookingId
* userId
* ownerId
* carId

Inside Stripe session metadata.

---

# Payment Security Requirements

* Verify webhook signatures
* Never trust frontend payment status
* Confirm payment only via webhook
* Use environment variables for keys
* Prevent duplicate payment processing

---

# Required Booking Schema Updates

Add fields:

```js id="jlwm7i"
paymentStatus: {
  type: String,
  enum: ["pending", "paid", "failed"]
},

stripeSessionId: String,

paymentIntentId: String
```

---

# Booking Expiry Logic

If payment not completed within:

```text id="jlwm7j"
10 minutes
```

Then:

* booking automatically expires,
* availability restored,
* user notified.

Use:

* BullMQ delayed jobs.

---

# Frontend Payment Requirements

---

## Checkout Flow

After booking request:

* redirect user to Stripe Checkout page.

---

## Success Page

Create:

```text id="jlwm7k"
/payment-success
```

Display:

* success message,
* booking confirmation.

---

## Cancel Page

Create:

```text id="jlwm7l"
/payment-cancelled
```

Display:

* failed/cancelled payment message.

---

# FEATURE 6 — Centralized Error Handling

## Goal

Standardize backend error responses.

---

## Required File

```text id="jlwm7m"
/middleware/errorHandler.js
```

---

## Standard Response

```js id="jlwm7n"
{
  success: false,
  message: "Error message"
}
```

---

# FEATURE 7 — Validation Middleware

## Goal

Reject invalid requests early.

---

## Preferred Library

```text id="jlwm7o"
Zod
```

---

## Required Validations

### Booking Validation

* valid dates,
* returnDate > pickupDate,
* car exists.

---

### Payment Validation

* booking exists,
* booking unpaid,
* booking belongs to authenticated user.

---

### Add Car Validation

Validate:

* brand,
* model,
* price,
* category,
* transmission,
* fuel type.

---

# 4. File Structure Requirements

```text id="jlwm7p"
server/
├── configs/
│   └── redis.js
│
├── queues/
│   └── bookingQueue.js
│
├── workers/
│   └── bookingWorker.js
│
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validate.js
│
├── validators/
│   ├── bookingValidator.js
│   ├── paymentValidator.js
│   └── carValidator.js
│
├── sockets/
│   └── socketHandler.js
│
├── payments/
│   ├── stripe.js
│   └── webhookHandler.js
│
├── models/
│   └── Notification.js
```

---

# 5. Non-Functional Requirements

---

# Performance Targets

| Metric                      | Target |
| --------------------------- | ------ |
| Cached response             | <100ms |
| Booking API                 | <300ms |
| Socket notification latency | <1s    |

---

# Reliability

Requirements:

* webhook verification,
* queue retries,
* Redis fallback,
* socket reconnect handling.

---

# Scalability

System should support:

* concurrent users,
* concurrent payments,
* async processing,
* high read traffic.

---

# Security Requirements

* JWT-protected APIs
* Secure Stripe webhook verification
* No sensitive payment data stored locally
* Protected socket rooms
* Validation on all write operations
* Environment variable secrets only

---

# 6. Deliverables

Agent must deliver:

---

## Backend

* Redis integration
* BullMQ queue system
* Worker process
* Socket.IO integration
* Stripe integration
* Webhook handling
* Notification persistence
* Validation middleware
* Centralized error handling

---

## Frontend

* Stripe checkout flow
* Live notifications
* Notification UI
* Real-time dashboard updates
* Payment success/cancel pages

---

## Documentation

Include:

* setup instructions,
* Redis setup,
* Stripe setup,
* webhook testing instructions,
* worker startup commands,
* socket architecture explanation.

---

# 7. Acceptance Criteria

Implementation is complete when:

* Stripe payments work correctly
* Webhooks verify securely
* Bookings confirm only after successful payment
* Cached endpoints work correctly
* Queue jobs process asynchronously
* Owners receive live notifications
* Notifications persist in database
* Validation rejects invalid requests
* Dashboard updates in real-time
* Worker retries failed jobs
* Unpaid bookings expire automatically
* Application remains stable under concurrent usage

---

# 8. Engineering Expectations

Implementation should follow:

* modular architecture,
* scalable backend practices,
* reusable services,
* separation of concerns,
* production-style folder structure,
* proper async handling.

Avoid:

* duplicated logic,
* socket logic inside controllers,
* direct Redis usage everywhere,
* business logic inside routes,
* trusting frontend payment status.

Use:

* services,
* helpers,
* middleware,
* event-driven workflows,
* reusable abstractions.
