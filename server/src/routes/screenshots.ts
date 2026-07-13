import { Router } from "express";
import * as screenshotController from "../controllers/screenshotController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post(
  "/capture",
  requireAuth,
  screenshotController.captureScreenshot,
);

export default router;
