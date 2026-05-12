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

//connect database

await connectDB();
await connectRedis();

//middleware

app.use(cors());

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

const server = app.listen(PORT,()=>console.log(`Server running on port ${PORT}`))
initSocket(server);
