import express from "express";
import authRoutes from "./auth.route";
import dailyRoutes from "./daily.route";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/daily", dailyRoutes);

export default router;
