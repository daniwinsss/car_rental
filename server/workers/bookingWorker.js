import "dotenv/config";
import { Worker } from "bullmq";
import connectDB from "../configs/db.js";
import { redisClient } from "../configs/redis.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";

const startWorker = async () => {
  if (!redisClient) {
    console.error("Redis not configured. Worker not started.");
    return;
  }

  await connectDB();
  const connection = redisClient.duplicate();

  new Worker(
    "bookingQueue",
    async (job) => {
      switch (job.name) {
        case "sendBookingEmail":
          console.log("Email stub:", job.data);
          break;
        case "notifyOwner":
          console.log("Notify owner stub:", job.data);
          break;
        case "expirePendingBooking": {
          const { bookingId } = job.data;
          const booking = await Booking.findById(bookingId);
          if (!booking) return;
          if (booking.status !== "pending_payment") return;
          booking.status = "expired";
          await booking.save();
          await Car.findByIdAndUpdate(booking.car, { isAvailable: true });
          console.log("Expired booking:", bookingId);
          break;
        }
        case "analyticsUpdate":
          console.log("Analytics update stub:", job.data);
          break;
        default:
          console.log("Unknown job:", job.name);
      }
    },
    { connection }
  );

  console.log("Booking worker started");
};

startWorker();
