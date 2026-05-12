import Notification from "../models/Notification.js";
import { successResponse } from "../utils/response.js";

export const getNotifications = async (req, res) => {
  try {
    const { _id } = req.user;
    const notifications = await Notification.find({ user: _id })
      .sort({ createdAt: -1 })
      .limit(50);
    return successResponse(res, {
      message: "Notifications fetched",
      data: { notifications },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const { _id } = req.user;
    const { ids } = req.body;
    const filter = ids?.length
      ? { user: _id, _id: { $in: ids } }
      : { user: _id, read: false };
    await Notification.updateMany(filter, { read: true });
    return successResponse(res, { message: "Notifications updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
