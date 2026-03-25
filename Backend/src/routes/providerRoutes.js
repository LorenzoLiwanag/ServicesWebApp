import express from "express";
import {
  getMyProviderServices,
  createProviderService,
  updateProviderService,
  deleteProviderService,
} from "../controllers/providerController.js";

const router = express.Router();

router.get("/services", getMyProviderServices);
router.post("/services", createProviderService);
router.put("/services/:providerServiceId", updateProviderService);
router.delete("/services/:providerServiceId", deleteProviderService);

export default router;