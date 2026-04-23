/**
 * users.routes.ts — Route definitions untuk resource /api/users
 */

import { Router } from "express";
import {
  getAllUsers,
  getUserByNik,
} from "../controllers/users.controller";

const router = Router();

/**
 * GET /api/users
 * Daftar seluruh petani + jumlah lahan (tanpa detail lahan)
 */
router.get("/", getAllUsers);

/**
 * GET /api/users/:nik
 * Detail 1 petani beserta seluruh lahan miliknya — 404 jika tidak ada
 */
router.get("/:nik", getUserByNik);

export default router;
