import { Request, Response, NextFunction } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({
      status: "error",
      message: "Akses ditolak. Silakan login terlebih dahulu.",
    });
  }
};
