import express from "express";
import {
  browseServices,
  listServiceCategories,
  getServiceDetail,
} from "../controllers/serviceController.js";

const router = express.Router();

router.get("/browse", browseServices);
router.get("/categories", listServiceCategories);
router.get("/:serviceId", getServiceDetail);

export default router;
