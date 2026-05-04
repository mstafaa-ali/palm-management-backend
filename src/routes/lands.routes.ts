/**
 * lands.routes.ts — Route definitions untuk resource /api/lands
 */

import { Router } from "express";
import {
  getAllLands,
  getLandsByNik,
  getLandStats,
  updateLand,
} from "../controllers/lands.controller";

const router = Router();

/**
 * GET /api/lands
 * Daftar seluruh lahan + info pemilik (join ke tabel users)
 */
router.get("/", getAllLands);

/**
 * GET /api/lands/user/:nik
 * Detail lahan berdasarkan NIK pemilik — 404 jika tidak ada
 */
router.get("/user/:nik", getLandsByNik);

/**
 * GET /api/lands/:id/stats
 * Agregasi total tonase dan chart_data bulanan
 */
router.get("/:id/stats", getLandStats);

/**
 * PUT /api/lands/:id
 * Update data lahan (jenis_bibit, koordinat_gps, dll)
 */
router.put("/:id", updateLand);

export default router;
