/**
 * work-logs.routes.ts — Route definitions untuk resource /api/work-logs
 */

import { Router } from "express";
import { createWorkLog, getWorkLogs } from "../controllers/work-logs.controller";
import { requireAuth } from "../lib/auth.middleware";

const router = Router();

/**
 * POST /api/work-logs
 * Menyimpan data harian hasil panen dan waktu kerja lapangan
 */
router.post("/", requireAuth, createWorkLog);

/**
 * GET /api/work-logs/user/:nik
 * Mengambil history log pekerja
 */
router.get("/user/:nik", getWorkLogs);

export default router;
