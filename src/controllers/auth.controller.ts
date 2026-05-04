import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extend session type to include user
declare module "express-session" {
  interface SessionData {
    user: {
      nik: string;
      nama_lengkap: string;
      lokasi_default: string | null;
    };
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nik, nomor_hp } = req.body;

    if (!nik) {
      res.status(400).json({
        status: "error",
        message: "NIK wajib diisi",
      });
      return;
    }

    // Cari user berdasarkan NIK
    const user = await prisma.user.findUnique({
      where: { nik },
      include: {
        lands: {
          take: 1, // Ambil satu lahan sebagai lokasi default
        },
      },
    });

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "NIK atau Nomor HP tidak valid",
      });
      return;
    }

    // Verifikasi Nomor HP (jika nomor_hp ada isinya di DB, cocokkan. Jika kosong, berarti harus pakai fallback atau tolak)
    // Berdasarkan request, pastikan nomor_hp cocok. Jika DB null, dan user mencoba login, kita bisa menolak atau accept sementara jika nomor_hp input kosong
    if (user.nomor_hp) {
      if (user.nomor_hp !== nomor_hp) {
        res.status(401).json({
          status: "error",
          message: "NIK atau Nomor HP tidak valid",
        });
        return;
      }
    } else {
      // Jika nomor_hp di DB null, tolak login karena tidak ada kata sandi yang valid
      // User harus menghubungi admin untuk update nomor HP
      res.status(403).json({
        status: "error",
        message: "Nomor HP belum terdaftar di sistem. Silakan hubungi admin.",
      });
      return;
    }

    // Set Session
    const lokasiDefault = user.lands.length > 0 ? user.lands[0].lokasi_kebun || "Lahan Tanpa Nama" : "Belum ada lahan terdaftar";
    
    req.session.user = {
      nik: user.nik,
      nama_lengkap: user.nama_lengkap,
      lokasi_default: lokasiDefault,
    };

    res.status(200).json({
      status: "success",
      message: "Login berhasil",
      data: req.session.user,
    });
  } catch (error) {
    console.error("[Login Error]:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server",
    });
  }
};

export const me = (req: Request, res: Response): void => {
  if (req.session && req.session.user) {
    res.status(200).json({
      status: "success",
      data: req.session.user,
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "Tidak terautentikasi",
    });
  }
};

export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error("[Logout Error]:", err);
      res.status(500).json({
        status: "error",
        message: "Gagal logout",
      });
      return;
    }

    // Clear cookie
    res.clearCookie("connect.sid", { path: "/" });
    res.status(200).json({
      status: "success",
      message: "Logout berhasil",
    });
  });
};
