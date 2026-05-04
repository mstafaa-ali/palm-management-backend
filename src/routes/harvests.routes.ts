import { Router } from "express";
import { getHarvestsByLand, createHarvest } from "../controllers/harvests.controller";

const router = Router();

// GET /api/harvests/land/:landId
router.get("/land/:landId", getHarvestsByLand);

// POST /api/harvests
router.post("/", createHarvest);

export default router;
