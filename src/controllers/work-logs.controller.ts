/**
 * work-logs.controller.ts — Controller untuk endpoint work logs
 */

import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function createWorkLog(req: Request, res: Response): Promise<void> {
  const { worker_nik, land_id, check_in_time, check_out_time, tonase } = req.body;

  // Basic Validation
  if (!worker_nik || !land_id || !check_in_time || !check_out_time || tonase === undefined) {
    res.status(400).json({ status: "error", message: "Semua field harus diisi." });
    return;
  }

  try {
    // Pastikan Land ada
    const landExists = await prisma.land.findUnique({ where: { id: land_id } });
    if (!landExists) {
      res.status(404).json({ status: "error", message: "Lahan tidak ditemukan." });
      return;
    }

    // Pastikan Worker NIK ada
    const workerExists = await prisma.user.findUnique({ where: { nik: worker_nik } });
    if (!workerExists) {
      res.status(404).json({ status: "error", message: "Pekerja dengan NIK tersebut tidak ditemukan." });
      return;
    }

    // Insert ke database
    const newLog = await prisma.workLog.create({
      data: {
        worker_nik,
        land_id,
        check_in_time: new Date(check_in_time),
        check_out_time: new Date(check_out_time),
        tonase: parseFloat(tonase),
      },
    });

    res.status(201).json({ status: "success", data: newLog });
  } catch (err) {
    console.error("[POST /api/work-logs] Error:", err);
    res.status(500).json({ status: "error", message: "Gagal menyimpan log kerja." });
  }
}

export async function getWorkLogs(req: Request, res: Response): Promise<void> {
  const { nik } = req.params;

  try {
    const logs = await prisma.workLog.findMany({
      where: {
        worker_nik: nik,
      },
      include: {
        land: {
          select: {
            lokasi_kebun: true,
            nama_kelompok_tani: true,
          }
        }
      },
      orderBy: {
        created_at: "desc",
      },
      take: 20 // Ambil maksimal 20 log terakhir
    });

    const formattedLogs = logs.map(log => ({
      id: log.id,
      location: log.land.lokasi_kebun || log.land.nama_kelompok_tani || 'Lahan Tanpa Nama',
      tonase: Number(log.tonase),
      check_in_time: log.check_in_time,
      check_out_time: log.check_out_time,
      created_at: log.created_at,
    }));

    res.status(200).json({ status: "success", data: formattedLogs });
  } catch (err) {
    console.error(`[GET /api/work-logs/user/${nik}] Error:`, err);
    res.status(500).json({ status: "error", message: "Gagal mengambil history kerja." });
  }
}

