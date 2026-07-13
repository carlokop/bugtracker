import { Router } from "express";
import * as proxyController from "../controllers/proxyController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, proxyController.proxyResource);

export default router;
