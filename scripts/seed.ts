/**
 * seed.ts — Script migrasi data CSV ke PostgreSQL
 *
 * Source CSV: "Data kartu tanda anggota DPP FPKS KALTIM (Jawaban).csv"
 * Delimiter  : semicolon (;)
 * Encoding   : UTF-8
 *
 * Cara jalankan:
 *   npm run seed
 *
 * Letakkan file CSV di: backend/data/
 * Nama file CSV bisa diatur di konstanta CSV_FILENAME di bawah.
 */

import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

// ─── Konfigurasi ──────────────────────────────────────────────────────────────
const CSV_FILENAME =
  "Data kartu tanda anggota DPP FPKS KALTIM (Jawaban) (1).csv";

// ─── Init Prisma ──────────────────────────────────────────────────────────────
const prisma = new PrismaClient({ log: ["warn", "error"] });

// ─── Type Definitions ─────────────────────────────────────────────────────────

/** Baris mentah dari CSV setelah parsing */
interface RawRow {
  [key: string]: string;
}

/** Data user yang sudah dibersihkan */
interface CleanedUser {
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir_raw: string | null;
  pendidikan_terakhir: string | null;
  alamat_lengkap: string | null;
  nomor_hp: string | null;
  jumlah_anggota_keluarga: number | null;
  status_keanggotaan: string | null;
}

/** Data lahan yang sudah dibersihkan */
interface CleanedLand {
  owner_nik: string;
  nama_kelompok_tani: string | null;
  lokasi_kebun: string | null;
  luas_ha: Prisma.Decimal | null;
  status_kepemilikan: string | null;
  jenis_sertifikasi: string | null;
  usia_tanam_raw: string | null;
  baseline_produksi_ton: Prisma.Decimal | null;
  produksi_raw: string | null;
  pabrik_mitra: string | null;
}

// ─── Peta nama kolom CSV → nama field internal ────────────────────────────────
// Dibuat lowercase agar tidak case-sensitive
const COL = {
  nik: "nomor induk kependudukan",
  nama: "nama lengkap",
  jumlah_kel: "jumlah anggota keluarga",
  jenis_kelamin: "jenis kelamin",
  tempat_lahir: "tempat lahir",
  tgl_lahir: "tanggal lahir",
  pendidikan: "pendidikan terakhir",
  alamat: "alamat lengkap",
  hp: "nomor hp",
  poktan: "nama kelompok tani/gapoktan (jika ada)",
  luas: "luas lahan sawit (hektar)",
  status_kepemilikan: "status kepemilikan lahan",
  sertifikasi: "jenis sertifikasi (jika ada)",
  produksi: "produksi rata-rata perbulan (ton tbs)",
  pabrik: "nama pabrik pengolahan mitra (jika ada)",
  usia_tanam: "usia tanaman",
  lokasi: "lokasi kebun",
  status_keanggotaan: "status keanggotaan",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Bersihkan nilai string, kembalikan null jika kosong/strip */
function clean(val: string | undefined): string | null {
  if (!val) return null;
  const s = val.trim();
  if (s === "" || s === "-" || s === "N/A") return null;
  return s;
}

/**
 * Ekstrak angka pertama dari string.
 * Handle format Indonesia: koma sebagai desimal ("1,5" → 1.5)
 * Contoh:
 *   "45 Ha"       → 45
 *   "1,5"         → 1.5
 *   "3.5"         → 3.5
 *   "5000-18000"  → 5000  (ambil angka pertama)
 *   "TBM"         → null
 *   "10 TBS"      → 10
 */
function extractNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s === "" || s === "-") return null;

  // Normalise: ganti koma desimal dgn titik, tapi hanya jika format "X,Y" (bukan "X,Y,Z")
  const normalized = s.replace(/^(\d+),(\d+)$/, "$1.$2").replace(/,/g, ".");

  // Ambil angka pertama (bisa float)
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const n = parseFloat(match[1]);
  return isNaN(n) ? null : n;
}

/** Ambil nilai kolom dari baris CSV berdasarkan nama kolom yang di-normalize */
function get(row: RawRow, colName: string): string | undefined {
  // Coba exact match dulu
  if (row[colName] !== undefined) return row[colName];
  // Fallback: cari key yang mengandung colName (partial match)
  const key = Object.keys(row).find((k) =>
    k.toLowerCase().trim().includes(colName.toLowerCase().trim())
  );
  return key ? row[key] : undefined;
}

// ─── Baca CSV ─────────────────────────────────────────────────────────────────
function readCSV(filePath: string): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File CSV tidak ditemukan:\n  ${filePath}`));
      return;
    }

    const results: RawRow[] = [];
    fs.createReadStream(filePath)
      .pipe(
        csv({
          separator: ";",                          // ← delimiter semicolon
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase(),           // normalise header ke lowercase
          mapValues: ({ value }) => value?.trim() ?? "",
          skipLines: 0,
        })
      )
      .on("data", (row: RawRow) => {
        // Lewati baris yang benar-benar kosong (semua value kosong)
        const allEmpty = Object.values(row).every((v) => !v || v.trim() === "");
        if (!allEmpty) results.push(row);
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

// ─── Cleaning: User ───────────────────────────────────────────────────────────
function cleanUser(row: RawRow): CleanedUser | null {
  const nik = clean(get(row, COL.nik));

  if (!nik) {
    // NIK kosong → lewati baris
    return null;
  }

  // Validasi dasar: NIK harus numerik (beberapa data punya 17 digit karena typo)
  const nikClean = nik.replace(/\D/g, ""); // buang karakter non-digit
  if (nikClean.length < 10) {
    console.warn(`  ⚠  NIK tidak valid, dilewati: "${nik}"`);
    return null;
  }

  const jumlahRaw = get(row, COL.jumlah_kel);
  const jumlah =
    jumlahRaw !== undefined ? parseInt(jumlahRaw, 10) : null;

  return {
    nik:                     nikClean,              // gunakan NIK yang sudah dibersihkan
    nama_lengkap:            clean(get(row, COL.nama)) ?? "UNKNOWN",
    jenis_kelamin:           clean(get(row, COL.jenis_kelamin)),
    tempat_lahir:            clean(get(row, COL.tempat_lahir)),
    tanggal_lahir_raw:       clean(get(row, COL.tgl_lahir)),
    pendidikan_terakhir:     clean(get(row, COL.pendidikan)),
    alamat_lengkap:          clean(get(row, COL.alamat)),
    nomor_hp:                clean(get(row, COL.hp)),
    jumlah_anggota_keluarga: !isNaN(jumlah as number) ? jumlah : null,
    status_keanggotaan:      clean(get(row, COL.status_keanggotaan)),
  };
}

// ─── Cleaning: Land ───────────────────────────────────────────────────────────
function cleanLand(row: RawRow, ownerNik: string): CleanedLand {
  const luasRaw    = get(row, COL.luas);
  const luasNum    = extractNumber(luasRaw);

  const produksiRaw = get(row, COL.produksi);
  const produksiNum = extractNumber(produksiRaw);

  // Simpan nilai asli produksi jika tidak bisa dikonversi ke angka
  // (contoh: "TBM", "TBS", "5000-18000", "10 TBS")
  const produksiText = clean(produksiRaw);
  const produksiSimpan =
    produksiNum === null && produksiText !== null ? produksiText : null;

  return {
    owner_nik:            ownerNik,
    nama_kelompok_tani:   clean(get(row, COL.poktan)),
    lokasi_kebun:         clean(get(row, COL.lokasi)),
    luas_ha:              luasNum !== null
                            ? new Prisma.Decimal(luasNum)
                            : null,
    status_kepemilikan:   clean(get(row, COL.status_kepemilikan)),
    jenis_sertifikasi:    clean(get(row, COL.sertifikasi)),
    usia_tanam_raw:       clean(get(row, COL.usia_tanam)),   // raw string: "4-12", "TBM", "8 bulan"
    baseline_produksi_ton: produksiNum !== null
                            ? new Prisma.Decimal(produksiNum)
                            : null,
    produksi_raw:         produksiSimpan,                    // simpan jika tidak bisa jadi angka
    pabrik_mitra:         clean(get(row, COL.pabrik)),
  };
}

// ─── Main Seeder ──────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🌿  Palm Management System — Database Seeder");
  console.log("═══════════════════════════════════════════════════════════");

  const filePath = path.join(__dirname, "..", "data", CSV_FILENAME);

  console.log(`\n📂 Membaca CSV: ${filePath}\n`);
  const rows = await readCSV(filePath);
  console.log(`   Total baris ditemukan : ${rows.length}`);

  let userUpserted   = 0;
  let userSkipped    = 0;
  let landInserted   = 0;
  let landSkipped    = 0;
  const seenNiks = new Set<string>();

  for (const row of rows) {
    // ── 1. Proses User ──────────────────────────────────────
    const user = cleanUser(row);

    if (!user) {
      userSkipped++;
      landSkipped++;
      continue;
    }

    // Upsert user — jika NIK sama, update data; jika baru, insert
    // NIK yang sudah di-upsert sebelumnya (dari baris duplikat) tidak perlu di-upsert lagi
    if (!seenNiks.has(user.nik)) {
      await prisma.user.upsert({
        where: { nik: user.nik },
        update: {
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
        create: user,
      });
      seenNiks.add(user.nik);
      userUpserted++;
    }

    // ── 2. Proses Land ──────────────────────────────────────
    // Setiap baris CSV = satu record lahan (meski user-nya sama / duplikat)
    const land = cleanLand(row, user.nik);

    // Skip jika lahan tidak punya data signifikan sama sekali
    const hasLandData =
      land.luas_ha !== null ||
      land.lokasi_kebun !== null ||
      land.nama_kelompok_tani !== null ||
      land.usia_tanam_raw !== null ||
      land.pabrik_mitra !== null;

    if (!hasLandData) {
      console.log(
        `  ℹ  Lahan NIK ${user.nik} tidak punya data lahan, dilewati.`
      );
      landSkipped++;
      continue;
    }

    await prisma.land.create({ data: land });
    landInserted++;
  }

  console.log("\n───────────────────────────────────────────────────────────");
  console.log(`  👤 Users upserted  : ${userUpserted}`);
  console.log(`  🌴 Lands inserted  : ${landInserted}`);
  console.log(`  ⏭  Baris dilewati  : ${userSkipped + landSkipped} (NIK kosong/invalid)`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  ✅  Seeding selesai!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Seeding gagal:", err.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
