import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  getPendingServices,
  approveProviderService,
  rejectProviderService,
  getMessageLogs,
  getCategories,
  createCategoryHandler,
  updateCategoryHandler,
  deactivateCategoryHandler,
  reactivateCategoryHandler,
  deleteCategoryHandler,
  getUncategorizedServicesHandler,
  assignServiceCategoryHandler,
} from "../controllers/adminController.js";
import {
  getDepositsToVerify,
  verifyDeposit,
  rejectDeposit,
  getPayoutsDue,
  sendPayout,
  getRefundsDue,
  sendRefund,
  getHolds,
  resolveHold,
} from "../controllers/paymentController.js";

const router = Router();

router.get("/pending-users", requireAuth, requireAdmin, getPendingUsers);
router.patch("/users/:id/approve", requireAuth, requireAdmin, approveUser);
router.patch("/users/:id/reject", requireAuth, requireAdmin, rejectUser);

router.get("/pending-services", requireAuth, requireAdmin, getPendingServices);
router.patch("/services/:id/approve", requireAuth, requireAdmin, approveProviderService);
router.patch("/services/:id/reject", requireAuth, requireAdmin, rejectProviderService);

router.get("/message-logs", requireAuth, requireAdmin, getMessageLogs);

router.get("/categories", requireAuth, requireAdmin, getCategories);
router.post("/categories", requireAuth, requireAdmin, createCategoryHandler);
router.patch("/categories/:id", requireAuth, requireAdmin, updateCategoryHandler);
router.patch("/categories/:id/deactivate", requireAuth, requireAdmin, deactivateCategoryHandler);
router.patch("/categories/:id/reactivate", requireAuth, requireAdmin, reactivateCategoryHandler);
router.delete("/categories/:id", requireAuth, requireAdmin, deleteCategoryHandler);

router.get("/services/uncategorized", requireAuth, requireAdmin, getUncategorizedServicesHandler);
router.patch("/services/:id/assign-category", requireAuth, requireAdmin, assignServiceCategoryHandler);

router.get("/payments/deposits", requireAuth, requireAdmin, getDepositsToVerify);
router.patch("/payments/:paymentId/verify", requireAuth, requireAdmin, verifyDeposit);
router.patch("/payments/:paymentId/reject", requireAuth, requireAdmin, rejectDeposit);
router.get("/payments/payouts", requireAuth, requireAdmin, getPayoutsDue);
router.post("/bookings/:bookingId/payout", requireAuth, requireAdmin, sendPayout);
router.get("/payments/refunds", requireAuth, requireAdmin, getRefundsDue);
router.post("/bookings/:bookingId/refund", requireAuth, requireAdmin, sendRefund);
router.get("/holds", requireAuth, requireAdmin, getHolds);
router.post("/bookings/:bookingId/resolve", requireAuth, requireAdmin, resolveHold);

export default router;
