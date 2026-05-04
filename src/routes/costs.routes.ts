import { Router } from "express";
import { getCostsByLand, createCost, deleteCost } from "../controllers/costs.controller";

const router = Router();

// GET /api/costs/land/:landId
router.get("/land/:landId", getCostsByLand);

// POST /api/costs
router.post("/", createCost);

// DELETE /api/costs/:id
router.delete("/:id", deleteCost);

export default router;
