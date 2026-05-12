import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotifications,
  markNotificationsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.post("/read", protect, markNotificationsRead);

export default notificationRouter;
