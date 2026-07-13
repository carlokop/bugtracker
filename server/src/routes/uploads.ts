import { Router } from "express";
import * as uploadController from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post(
  "/screenshot",
  requireAuth,
  uploadController.uploadScreenshot,
);

export default router;
