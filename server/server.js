import express from 'express';
import "dotenv/config";
import cors from "cors";
import connectDB from './configs/db.js';
import { connectRedis } from './configs/redis.js';
import userRouter from './routes/userRoutes.js';
import ownerRouter from './routes/ownerRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { initSocket } from './sockets/socketHandler.js';
import notificationRouter from './routes/notificationRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';


//initialize express app

const app = express();

let isInitialized = false;
const ensureInitialized = async () => {
  if (isInitialized) return;
  await connectDB();
  await connectRedis();
  isInitialized = true;
};

//middleware

const allowedOrigins = [process.env.CLIENT_URL, process.env.VERCEL_URL]
  .filter(Boolean)
  .map((origin) => origin.startsWith("http") ? origin : `https://${origin}`);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(
  "/*",
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());


app.get('/',(req,res)=>res.send("server is running"))

app.use('/api/user',userRouter)
app.use('/api/owner',ownerRouter);
app.use('/api/bookings',bookingRouter);
app.use('/api/chat',chatRouter);
app.use('/api/notifications',notificationRouter);
app.use('/api/payments',paymentRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  initSocket(server);
}

export default app;
