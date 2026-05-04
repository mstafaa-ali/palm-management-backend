import { Request, Response } from "express";
import prisma from "../lib/prisma";

/**
 * GET /api/costs/land/:landId
 * Mengambil data biaya operasional berdasarkan land_id
 */
export const getCostsByLand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { landId } = req.params;

    // Resolve landId (might be owner_nik from the frontend route)
    let actualLandId = landId;
    const land = await prisma.land.findFirst({
      where: { owner_nik: landId },
    });
    if (land) {
      actualLandId = land.id;
    }

    const costs = await prisma.cost.findMany({
      where: {
        land_id: actualLandId,
      },
      orderBy: {
        tanggal: "desc",
      },
    });

    res.json({
      success: true,
      data: costs,
    });
  } catch (error: any) {
    console.error("Error fetching costs:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data biaya.",
    });
  }
};

/**
 * POST /api/costs
 * Menambahkan data biaya operasional baru
 */
export const createCost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { land_id, tanggal, jenis_biaya, jumlah_biaya, keterangan } =
      req.body;

    if (!land_id || !tanggal || !jenis_biaya || !jumlah_biaya) {
      res.status(400).json({
        success: false,
        message: "Semua field wajib (kecuali keterangan) harus diisi.",
      });
      return;
    }

    // Resolve land_id (might be owner_nik from the frontend route)
    let actualLandId = land_id;
    const land = await prisma.land.findFirst({
      where: { owner_nik: land_id },
    });
    if (land) {
      actualLandId = land.id;
    }

    const newCost = await prisma.cost.create({
      data: {
        land_id: actualLandId,
        tanggal: new Date(tanggal),
        jenis_biaya,
        jumlah_biaya: Number(jumlah_biaya),
        keterangan: keterangan || null,
      },
    });

    res.status(201).json({
      success: true,
      data: newCost,
      message: "Data biaya operasional berhasil ditambahkan.",
    });
  } catch (error: any) {
    console.error("Error creating cost:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menyimpan data biaya.",
    });
  }
};

/**
 * DELETE /api/costs/:id
 * Menghapus data biaya operasional
 */
export const deleteCost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const existingCost = await prisma.cost.findUnique({
      where: { id },
    });

    if (!existingCost) {
      res.status(404).json({
        success: false,
        message: "Data biaya tidak ditemukan.",
      });
      return;
    }

    await prisma.cost.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Data biaya berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("Error deleting cost:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus data biaya.",
    });
  }
};
