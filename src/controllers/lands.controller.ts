/**
 * lands.controller.ts — Controller untuk endpoint lands
 *
 * Berisi seluruh logika bisnis untuk resource /api/lands.
 * Route handler hanya mendelegasikan ke controller ini.
 */

import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ─── Tipe Response ────────────────────────────────────────────────────────────

interface ApiSuccess<T> {
  status: "success";
  data: T;
  total?: number;
}

interface ApiError {
  status: "error";
  message: string;
}

// ─── Helper Response ──────────────────────────────────────────────────────────

function successResponse<T>(data: T, total?: number): ApiSuccess<T> {
  return { status: "success", data, ...(total !== undefined && { total }) };
}

function errorResponse(message: string): ApiError {
  return { status: "error", message };
}

// ─── GET /api/lands ───────────────────────────────────────────────────────────
/**
 * Mengembalikan daftar seluruh lahan beserta info pemilik:
 * nama_lengkap, status_keanggotaan, dan nomor_hp.
 */
export async function getAllLands(req: Request, res: Response): Promise<void> {
  try {
    const lands = await prisma.land.findMany({
      include: {
        owner: {
          select: {
            nama_lengkap:       true,
            nomor_hp:           true,
            status_keanggotaan: true,
          },
        },
      },
      orderBy: { owner_nik: "asc" },
    });

    // Flatten: gabungkan field owner ke dalam setiap objek lahan
    const data = lands.map((land) => ({
      id:                    land.id,
      owner_nik:             land.owner_nik,
      // ── Info pemilik (dari join) ──────────────────────
      nama_pemilik:          land.owner.nama_lengkap,
      nomor_hp_pemilik:      land.owner.nomor_hp,
      status_keanggotaan:    land.owner.status_keanggotaan,
      // ── Data lahan ────────────────────────────────────
      nama_kelompok_tani:    land.nama_kelompok_tani,
      lokasi_kebun:          land.lokasi_kebun,
      luas_ha:               land.luas_ha,
      status_kepemilikan:    land.status_kepemilikan,
      jenis_sertifikasi:     land.jenis_sertifikasi,
      usia_tanam_raw:        land.usia_tanam_raw,
      baseline_produksi_ton: land.baseline_produksi_ton,
      produksi_raw:          land.produksi_raw,
      pabrik_mitra:          land.pabrik_mitra,
    }));

    res.status(200).json(successResponse(data, data.length));
  } catch (err) {
    console.error("[GET /api/lands] Error:", err);
    res.status(500).json(errorResponse("Gagal mengambil data lahan."));
  }
}

// ─── GET /api/lands/user/:nik ─────────────────────────────────────────────────
/**
 * Mengembalikan semua lahan milik 1 petani berdasarkan NIK.
 * Sertakan seluruh detail lahan + data pemilik.
 * Kembalikan 404 jika NIK tidak ditemukan.
 */
export async function getLandsByNik(req: Request, res: Response): Promise<void> {
  const { nik } = req.params;

  try {
    // Cari user + lahan-lahannya sekaligus
    const user = await prisma.user.findUnique({
      where: { nik },
      include: {
        lands: {
          orderBy: { luas_ha: "desc" },
        },
      },
    });

    if (!user) {
      res.status(404).json(
        errorResponse(`Petani dengan NIK '${nik}' tidak ditemukan.`)
      );
      return;
    }

    // Shape response: pisahkan info pemilik dan daftar lahan
    const responseData = {
      pemilik: {
        nik:                     user.nik,
        nama_lengkap:            user.nama_lengkap,
        jenis_kelamin:           user.jenis_kelamin,
        tempat_lahir:            user.tempat_lahir,
        tanggal_lahir_raw:       user.tanggal_lahir_raw,
        pendidikan_terakhir:     user.pendidikan_terakhir,
        alamat_lengkap:          user.alamat_lengkap,
        nomor_hp:                user.nomor_hp,
        jumlah_anggota_keluarga: user.jumlah_anggota_keluarga,
        status_keanggotaan:      user.status_keanggotaan,
      },
      total_lahan: user.lands.length,
      lahan: user.lands.map((land) => ({
        id:                    land.id,
        nama_kelompok_tani:    land.nama_kelompok_tani,
        lokasi_kebun:          land.lokasi_kebun,
        luas_ha:               land.luas_ha,
        status_kepemilikan:    land.status_kepemilikan,
        jenis_sertifikasi:     land.jenis_sertifikasi,
        usia_tanam_raw:        land.usia_tanam_raw,
        baseline_produksi_ton: land.baseline_produksi_ton,
        produksi_raw:          land.produksi_raw,
        pabrik_mitra:          land.pabrik_mitra,
      })),
    };

    res.status(200).json(successResponse(responseData));
  } catch (err) {
    console.error(`[GET /api/lands/user/${nik}] Error:`, err);
    res.status(500).json(errorResponse("Gagal mengambil data lahan petani."));
  }
}

// ─── GET /api/lands/:id/stats ─────────────────────────────────────────────────
/**
 * Mengembalikan statistik tonase bulanan untuk sebuah lahan (id = land_id/nik).
 */
export async function getLandStats(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    // 1. Cari lahan untuk mendapatkan baseline_produksi_ton (Gunakan id sebagai land_id atau fallback ke owner_nik jika itu NIK pengguna, namun instruksi mengatakan berdasarkan land_id, maka kita asumsikan id adalah land_id, ATAU kita cek owner_nik kalau stringnya bukan UUID).
    // Karena page UI sebelumnya pakai owner_nik di route /lahan/:nik, kita coba cari berdasarkan owner_nik dulu. Jika tidak ada, coba id.
    const land = await prisma.land.findFirst({
      where: {
        OR: [
          { owner_nik: id },
          // Cek id sebagai UUID (opsional, tapi psql akan error jika id bukan UUID struct. Jadi mending catch kalau error)
        ]
      }
    });

    let landIdStr = id;
    let baselineTonase = 0;
    
    if (land) {
      landIdStr = land.id;
      baselineTonase = land.baseline_produksi_ton ? Number(land.baseline_produksi_ton) : 0;
    } else {
      // Coba directly panggil id sbg land_id
      try {
        const directLand = await prisma.land.findUnique({ where: { id: id } });
        if (directLand) {
          baselineTonase = directLand.baseline_produksi_ton ? Number(directLand.baseline_produksi_ton) : 0;
        }
      } catch (e) {
        // Abaikan jika bukan UUID
      }
    }

    // 2. Tentukan periode bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 3. Ambil semua log kerja bulan ini untuk lahan tersebut guna chart harian
    const logs = await prisma.workLog.findMany({
      where: {
        land_id: landIdStr,
        check_in_time: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      orderBy: { check_in_time: "asc" }
    });

    // 4. Hitung agregasi dengan fungsi prisma aggregate
    const aggregateResult = await prisma.workLog.aggregate({
      _sum: {
        tonase: true
      },
      where: {
        land_id: landIdStr,
        check_in_time: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      }
    });

    let totalCurrentMonth = Number(aggregateResult._sum.tonase || 0);

    // Format chart_data bulanan
    const dailyMap: Record<string, number> = {};

    for (const log of logs) {
      const tonase = Number(log.tonase);
      const dateStr = log.check_in_time.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!dailyMap[dateStr]) dailyMap[dateStr] = 0;
      dailyMap[dateStr] += tonase;
    }

    const chart_data = Object.keys(dailyMap).sort().map(date => ({
      date,
      tonase: dailyMap[date]
    }));

    // Response Final
    res.status(200).json({
      status: "success",
      data: {
        baseline_tonase: baselineTonase,
        real_tonase_current_month: totalCurrentMonth,
        chart_data: chart_data
      }
    });

  } catch (err) {
    console.error(`[GET /api/lands/${id}/stats] Error:`, err);
    res.status(500).json(errorResponse("Gagal memuat statistik lahan."));
  }
}

