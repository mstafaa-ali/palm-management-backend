import { Router } from "express";
import { login, me, logout } from "../controllers/auth.controller";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter untuk login guna mencegah brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Batasi setiap IP maksimal 5 request per windowMs
  message: {
    status: "error",
    message: "Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, login);
router.get("/me", me);
router.post("/logout", logout);

export default router;
