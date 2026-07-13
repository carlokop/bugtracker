import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router = Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authController.me);
router.get("/users", requireAuth, requireRole("admin"), authController.getUsers);

export default router;
