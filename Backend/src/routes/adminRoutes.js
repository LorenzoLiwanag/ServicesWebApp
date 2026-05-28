import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getPendingUsers,
  approveUser,
  getPendingServices,
  approveProviderService,
  getMessageLogs,
} from "../controllers/adminController.js";

const router = Router();

router.get("/pending-users", requireAuth, requireAdmin, getPendingUsers);
router.patch("/users/:id/approve", requireAuth, requireAdmin, approveUser);

router.get("/pending-services", requireAuth, requireAdmin, getPendingServices);
router.patch("/services/:id/approve", requireAuth, requireAdmin, approveProviderService);

router.get("/message-logs", requireAuth, requireAdmin, getMessageLogs);

export default router;
