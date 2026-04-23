/**
 * users.controller.ts — Controller untuk endpoint users
 */

import { Request, Response } from "express";
import prisma from "../lib/prisma";

interface ApiSuccess<T> {
  status: "success";
  data: T;
  total?: number;
}

interface ApiError {
  status: "error";
  message: string;
}

function successResponse<T>(data: T, total?: number): ApiSuccess<T> {
  return { status: "success", data, ...(total !== undefined && { total }) };
}

function errorResponse(message: string): ApiError {
  return { status: "error", message };
}

// ─── GET /api/users ───────────────────────────────────────────────────────────
/**
 * Mengembalikan daftar seluruh petani (tanpa data lahan).
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        nik:                     true,
        nama_lengkap:            true,
        jenis_kelamin:           true,
        tempat_lahir:            true,
        tanggal_lahir_raw:       true,
        pendidikan_terakhir:     true,
        nomor_hp:                true,
        jumlah_anggota_keluarga: true,
        status_keanggotaan:      true,
        // ringkasan lahan: hanya hitung total
        _count: { select: { lands: true } },
      },
      orderBy: { nama_lengkap: "asc" },
    });

    const data = users.map((u) => ({
      ...u,
      total_lahan: u._count.lands,
      _count: undefined,         // buang field _count dari response
    }));

    res.status(200).json(successResponse(data, data.length));
  } catch (err) {
    console.error("[GET /api/users] Error:", err);
    res.status(500).json(errorResponse("Gagal mengambil data petani."));
  }
}

// ─── GET /api/users/:nik ──────────────────────────────────────────────────────
/**
 * Mengembalikan detail 1 petani beserta seluruh lahan miliknya.
 */
export async function getUserByNik(req: Request, res: Response): Promise<void> {
  const { nik } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { nik },
      include: { lands: true },
    });

    if (!user) {
      res.status(404).json(
        errorResponse(`Petani dengan NIK '${nik}' tidak ditemukan.`)
      );
      return;
    }

    res.status(200).json(successResponse(user));
  } catch (err) {
    console.error(`[GET /api/users/${nik}] Error:`, err);
    res.status(500).json(errorResponse("Gagal mengambil data petani."));
  }
}
