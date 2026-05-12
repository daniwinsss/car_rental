import express from "express";
import { protect } from "../middleware/auth.js";
import { createCheckoutSession } from "../controllers/paymentController.js";
import { handleStripeWebhook } from "../payments/webhookHandler.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-checkout-session", protect, createCheckoutSession);
paymentRouter.post("/webhook", handleStripeWebhook);

export default paymentRouter;
