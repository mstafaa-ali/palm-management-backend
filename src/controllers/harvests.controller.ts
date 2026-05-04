import { Request, Response } from "express";
import prisma from "../lib/prisma";

/**
 * GET /api/harvests/land/:landId
 * Mengambil data panen berdasarkan land_id
 */
export const getHarvestsByLand = async (
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

    const harvests = await prisma.harvest.findMany({
      where: {
        land_id: actualLandId,
      },
      orderBy: {
        tanggal_panen: "desc",
      },
    });

    res.json({
      success: true,
      data: harvests,
    });
  } catch (error: any) {
    console.error("Error fetching harvests:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan server saat mengambil data panen.",
      });
  }
};

/**
 * POST /api/harvests
 * Menambahkan data panen baru
 */
export const createHarvest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { land_id, tanggal_panen, jumlah_janjang, estimasi_berat_kg } =
      req.body;

    if (!land_id || !tanggal_panen || !jumlah_janjang || !estimasi_berat_kg) {
      res
        .status(400)
        .json({ success: false, message: "Semua field harus diisi." });
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

    const newHarvest = await prisma.harvest.create({
      data: {
        land_id: actualLandId,
        tanggal_panen: new Date(tanggal_panen),
        jumlah_janjang: Number(jumlah_janjang),
        estimasi_berat_kg: Number(estimasi_berat_kg),
      },
    });

    res.status(201).json({
      success: true,
      data: newHarvest,
      message: "Data panen berhasil ditambahkan.",
    });
  } catch (error: any) {
    console.error("Error creating harvest:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan server saat menyimpan data panen.",
      });
  }
};
