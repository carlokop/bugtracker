import { Router } from "express";
import * as projectController from "../controllers/projectController.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { requireProjectAccess } from "../middleware/requireProjectAccess.js";

const router = Router();

router.get("/", requireAuth, projectController.listProjects);
router.post("/", requireAuth, requireRole("admin"), projectController.createProject);
router.get(
  "/:id",
  requireAuth,
  requireProjectAccess,
  projectController.getProject,
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  requireProjectAccess,
  projectController.updateProject,
);

router.get(
  "/:projectId/members",
  requireAuth,
  requireRole("admin"),
  requireProjectAccess,
  projectController.listProjectMembers,
);
router.post(
  "/:projectId/members",
  requireAuth,
  requireRole("admin"),
  requireProjectAccess,
  projectController.createClientUser,
);
router.patch(
  "/:projectId/members/:userId",
  requireAuth,
  requireRole("admin"),
  requireProjectAccess,
  projectController.updateClientUser,
);
router.delete(
  "/:projectId/members/:userId",
  requireAuth,
  requireRole("admin"),
  requireProjectAccess,
  projectController.removeClientUser,
);

export default router;
