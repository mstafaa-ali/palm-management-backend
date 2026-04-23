/**
 * server.ts — Entry point aplikasi backend Palm Management System
 *
 * Responsibilities:
 *  - Setup Express + middleware (cors, json parser)
 *  - Mount semua route
 *  - Start HTTP server
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import landsRoutes from "./routes/lands.routes";
import usersRoutes from "./routes/users.routes";
import workLogsRoutes from "./routes/work-logs.routes";

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Development : allow semua origin (Postman, browser, frontend port apapun)
// Production  : restrict ke whitelist
const ALLOWED_ORIGINS_PROD = [
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsOptions: cors.CorsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? (origin, callback) => {
          // Di production: blokir jika origin tidak ada di whitelist
          if (!origin || ALLOWED_ORIGINS_PROD.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin '${origin}' tidak diizinkan.`));
          }
        }
      : true, // Di development: izinkan semua origin (termasuk Postman & browser langsung)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status:    "success",
    service:   "Palm Management API",
    version:   "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/lands", landsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/work-logs", workLogsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status:  "error",
    message: "Endpoint tidak ditemukan.",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Global Error]:", err.message);
  res.status(500).json({
    status:  "error",
    message: "Terjadi kesalahan pada server.",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("═══════════════════════════════════════════════════");
  console.log(`  🌴 Palm Management API`);
  console.log(`  🚀 Running at http://localhost:${PORT}`);
  console.log(`  📋 Endpoints:`);
  console.log(`     GET /health`);
  console.log(`     GET /api/lands`);
  console.log(`     GET /api/lands/user/:nik`);
  console.log(`     GET /api/users`);
  console.log(`     GET /api/users/:nik`);
  console.log("═══════════════════════════════════════════════════");
});

export default app;
