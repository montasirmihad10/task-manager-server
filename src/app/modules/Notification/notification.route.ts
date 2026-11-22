import express from "express";
import { notificationControllers } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  notificationControllers.getMyNotifications,
);

router.get(
  "/unread-count",
  auth("user", "admin", "super_admin"),
  notificationControllers.getUnreadCount,
);

router.patch(
  "/read-all",
  auth("user", "admin", "super_admin"),
  notificationControllers.markAllAsRead,
);

router.patch(
  "/:id/read",
  auth("user", "admin", "super_admin"),
  notificationControllers.markAsRead,
);

export const notificationRoutes = router;
