import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let ioInstance = null;

export const initSocket = (server) => {
  const allowedOrigins = [process.env.CLIENT_URL, process.env.VERCEL_URL]
    .filter(Boolean)
    .map((origin) => origin.startsWith("http") ? origin : `https://${origin}`);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const userId = jwt.decode(token, process.env.JWT_SECRET);
      if (!userId) return next();
      const user = await User.findById(userId).select("-password");
      socket.user = user || null;
      return next();
    } catch (error) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    if (user && user.role === "owner") {
      socket.join(`owner:${user._id}`);
    }
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;
