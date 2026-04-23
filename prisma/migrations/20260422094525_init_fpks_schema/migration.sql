-- CreateTable
CREATE TABLE "users" (
    "nik" VARCHAR(50) NOT NULL,
    "nama_lengkap" VARCHAR(255) NOT NULL,
    "jenis_kelamin" VARCHAR(20),
    "tempat_lahir" VARCHAR(100),
    "tanggal_lahir_raw" VARCHAR(100),
    "pendidikan_terakhir" VARCHAR(100),
    "alamat_lengkap" TEXT,
    "nomor_hp" VARCHAR(30),
    "jumlah_anggota_keluarga" INTEGER,
    "status_keanggotaan" VARCHAR(100),

    CONSTRAINT "users_pkey" PRIMARY KEY ("nik")
);

-- CreateTable
CREATE TABLE "lands" (
    "id" UUID NOT NULL,
    "owner_nik" VARCHAR(50) NOT NULL,
    "nama_kelompok_tani" VARCHAR(255),
    "lokasi_kebun" TEXT,
    "luas_ha" DECIMAL(10,4),
    "status_kepemilikan" VARCHAR(100),
    "jenis_sertifikasi" VARCHAR(100),
    "usia_tanam_raw" VARCHAR(100),
    "baseline_produksi_ton" DECIMAL(10,4),
    "produksi_raw" VARCHAR(100),
    "pabrik_mitra" VARCHAR(255),

    CONSTRAINT "lands_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lands" ADD CONSTRAINT "lands_owner_nik_fkey" FOREIGN KEY ("owner_nik") REFERENCES "users"("nik") ON DELETE CASCADE ON UPDATE CASCADE;
