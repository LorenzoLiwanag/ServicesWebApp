import express from "express";
import {
  getMyProviderProfile,
  updateMyProviderProfile,
  getMyProviderServices,
  createProviderService,
  updateProviderService,
  patchProviderServiceVisibility,
  deleteProviderService,
} from "../controllers/providerController.js";

const router = express.Router();

router.get("/profile", getMyProviderProfile);
router.put("/profile", updateMyProviderProfile);

router.get("/services", getMyProviderServices);
router.post("/services", createProviderService);
router.put("/services/:providerServiceId", updateProviderService);
router.patch("/services/:providerServiceId/visibility", patchProviderServiceVisibility);
router.delete("/services/:providerServiceId", deleteProviderService);

export default router;
