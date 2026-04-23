# 🌴 Palm Management System — Backend

Backend API berbasis **Node.js + TypeScript + Express + Prisma ORM** untuk sistem manajemen lahan sawit.

---

## 📁 Struktur Folder

```
backend/
├── prisma/
│   └── schema.prisma        # Skema database (users + lands)
├── scripts/
│   └── seed.ts              # Script migrasi CSV → PostgreSQL
├── src/
│   └── server.ts            # Express API server
├── data/                    # ← Letakkan file CSV di sini (dibuat manual)
│   ├── data_petani.csv      # Data users/petani
│   └── data_lahan.csv       # Data lahan
├── .env                     # Konfigurasi DB (dibuat dari .env.example)
├── .env.example             # Template .env
├── package.json
└── tsconfig.json
```

---

## 🚀 Setup & Menjalankan

### 1. Masuk ke folder backend
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
# Salin template .env
cp .env.example .env

# Edit .env dan isi kredensial PostgreSQL Anda:
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/palm_management_db?schema=public"
```

### 4. Buat database di PostgreSQL
```sql
-- Jalankan di psql atau pgAdmin:
CREATE DATABASE palm_management_db;
```

### 5. Jalankan migrasi Prisma (buat tabel di database)
```bash
npx prisma migrate dev --name init
```
> Atau jika ingin push schema tanpa membuat file migrasi:
> ```bash
> npx prisma db push
> ```

### 6. Generate Prisma Client
```bash
npx prisma generate
```

### 7. Letakkan file CSV di folder `data/`
```
backend/data/data_petani.csv   → Data users (kolom: nik, nama_lengkap, tempat_tanggal_lahir, nomor_hp, pendidikan_terakhir, status_fpks)
backend/data/data_lahan.csv    → Data lahan (kolom: nik_pemilik, lokasi_kebun, luas_ha, usia_tanam, produksi_rata_rata, pabrik_mitra)
```

### 8. Jalankan seed script
```bash
npm run seed
```

### 9. Jalankan API server (development)
```bash
npm run dev
```

---

## 📊 Format CSV yang Didukung

### `data_petani.csv` (Users)
| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| `nik` | NIK petani (Primary Key) | `1234567890123456` |
| `nama_lengkap` | Nama lengkap | `Ahmad Ridwan` |
| `tempat_tanggal_lahir` | TTL (format bebas) | `Pekanbaru, 12 Maret 1985` |
| `nomor_hp` | Nomor HP | `08123456789` |
| `pendidikan_terakhir` | Pendidikan | `SMA` |
| `status_fpks` | Status FPKS | `Aktif` |

### `data_lahan.csv` (Lands)
| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| `nik_pemilik` | NIK pemilik (FK ke users) | `1234567890123456` |
| `lokasi_kebun` | Lokasi kebun | `Desa Siak Hulu, Kampar` |
| `luas_ha` | Luas lahan | `45 Ha` atau `12.5` |
| `usia_tanam` | Usia tanaman (raw string) | `4-12` / `2 dan 7` / `8 bulan` |
| `produksi_rata_rata` | Produksi baseline | `8 T` atau `12` |
| `pabrik_mitra` | Nama pabrik mitra | `PTPN V` |

> **Data Cleaning otomatis:**
> - `luas_ha` → Angka pertama diekstrak: `"45 Ha"` → `45`
> - `produksi_rata_rata` → Angka pertama diekstrak: `"8 T"` → `8`
> - `usia_tanam` → Disimpan **apa adanya** sebagai string

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/users` | Semua petani (dengan data lahan) |
| GET | `/api/users/:nik` | Detail petani berdasarkan NIK |
| GET | `/api/lands` | Semua lahan (dengan data pemilik) |

---

## 🛠 npm Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `npm run dev` | `ts-node-dev src/server.ts` | Jalankan dev server |
| `npm run seed` | `ts-node scripts/seed.ts` | Jalankan migrasi CSV |
| `npm run build` | `tsc` | Build ke JavaScript |
| `npm run start` | `node dist/server.js` | Jalankan production server |
| `npm run db:studio` | `prisma studio` | Buka Prisma Studio (GUI DB) |
