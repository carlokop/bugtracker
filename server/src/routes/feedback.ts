import { Router } from "express";
import * as feedbackController from "../controllers/feedbackController.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import {
  requireFeedbackAccess,
  requireProjectAccess,
} from "../middleware/requireProjectAccess.js";

const router = Router();

router.get(
  "/projects/:projectId/feedback",
  requireAuth,
  requireProjectAccess,
  feedbackController.listFeedback,
);
router.get(
  "/projects/:projectId/feedback/counts",
  requireAuth,
  requireProjectAccess,
  feedbackController.getFeedbackCounts,
);
router.post(
  "/projects/:projectId/feedback/bugs",
  requireAuth,
  requireProjectAccess,
  feedbackController.createBug,
);
router.post(
  "/projects/:projectId/feedback/features",
  requireAuth,
  requireRole("admin"),
  requireProjectAccess,
  feedbackController.createFeature,
);

router.get(
  "/feedback/:id",
  requireAuth,
  requireFeedbackAccess,
  feedbackController.getFeedbackItem,
);
router.patch(
  "/feedback/:id/status",
  requireAuth,
  requireFeedbackAccess,
  feedbackController.updateFeedbackStatus,
);
router.post(
  "/feedback/:id/deliver",
  requireAuth,
  requireRole("admin"),
  requireFeedbackAccess,
  feedbackController.deliverFeature,
);
router.post(
  "/feedback/:id/convert-to-bug",
  requireAuth,
  requireFeedbackAccess,
  feedbackController.convertFeatureToBug,
);
router.delete(
  "/feedback/:id",
  requireAuth,
  requireRole("admin"),
  requireFeedbackAccess,
  feedbackController.deleteFeedback,
);
router.get(
  "/feedback/:id/comments",
  requireAuth,
  requireFeedbackAccess,
  feedbackController.listComments,
);
router.post(
  "/feedback/:id/comments",
  requireAuth,
  requireFeedbackAccess,
  feedbackController.addComment,
);
router.get(
  "/feedback/:id/linked-bugs",
  requireAuth,
  requireFeedbackAccess,
  feedbackController.getBugsForFeature,
);

export default router;
