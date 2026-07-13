import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, notificationController.listNotifications);
router.patch(
  "/:id/read",
  requireAuth,
  notificationController.markNotificationRead,
);
router.post(
  "/read-all",
  requireAuth,
  notificationController.markAllNotificationsRead,
);

export default router;
