/**
 * work-logs.routes.ts — Route definitions untuk resource /api/work-logs
 */

import { Router } from "express";
import { createWorkLog, getWorkLogs } from "../controllers/work-logs.controller";

const router = Router();

/**
 * POST /api/work-logs
 * Menyimpan data harian hasil panen dan waktu kerja lapangan
 */
router.post("/", createWorkLog);

/**
 * GET /api/work-logs/user/:nik
 * Mengambil history log pekerja
 */
router.get("/user/:nik", getWorkLogs);

export default router;
