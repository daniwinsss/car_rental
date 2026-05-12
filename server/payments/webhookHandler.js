import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import Notification from "../models/Notification.js";
import { stripe } from "./stripe.js";
import { addBookingJob } from "../queues/bookingQueue.js";
import { deleteCache } from "../utils/cache.js";
import { getIO } from "../sockets/socketHandler.js";

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!stripe || !signature) {
    return res.status(400).json({ success: false, message: "Invalid webhook" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    const ownerId = session.metadata?.ownerId;
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.paymentStatus !== "paid") {
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
        booking.stripeSessionId = session.id;
        booking.paymentIntentId = session.payment_intent;
        await booking.save();

        await Car.findByIdAndUpdate(booking.car, { isAvailable: false });
        await deleteCache("cars");
        if (ownerId) {
          await deleteCache(`dashboard:${ownerId}`);
        }

        await Notification.create({
          user: booking.owner,
          message: "Payment successful",
          type: "paymentSuccessful",
        });

        const io = getIO();
        if (io && ownerId) {
          io.to(`owner:${ownerId}`).emit("paymentSuccessful", { bookingId });
        }

        await addBookingJob("notifyOwner", { bookingId, ownerId });
        await addBookingJob("sendBookingEmail", { bookingId });
        await addBookingJob("analyticsUpdate", { ownerId });
      }
    }
  }

  return res.json({ received: true });
};
