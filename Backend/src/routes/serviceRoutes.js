import express from "express";
import {
  browseServices,
  listServiceCategories,
} from "../controllers/serviceController.js";

const router = express.Router();

router.get("/browse", browseServices);
router.get("/categories", listServiceCategories);

export default router;