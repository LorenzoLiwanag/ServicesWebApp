import express from "express";
import { browseServices } from "../controllers/serviceController.js";

const router = express.Router();

router.get("/browse", browseServices);

export default router;