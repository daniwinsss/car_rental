import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import { stripe } from "../payments/stripe.js";
import { successResponse } from "../utils/response.js";

export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res
        .status(500)
        .json({ success: false, message: "Stripe not configured" });
    }

    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate("car");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    if (booking.paymentStatus === "paid") {
      return res
        .status(409)
        .json({ success: false, message: "Booking already paid" });
    }

    const car = await Car.findById(booking.car);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || "usd",
            product_data: {
              name: `${car.brand} ${car.model}`,
            },
            unit_amount: Math.round(booking.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: booking.user.toString(),
        ownerId: booking.owner.toString(),
        carId: booking.car._id.toString(),
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    return successResponse(res, {
      message: "Checkout session created",
      data: { url: session.url, sessionId: session.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
