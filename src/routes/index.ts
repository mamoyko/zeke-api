import express from "express";
import authRoutes from "./auth.route";
import dailyRoutes from "./daily.route";
import bountyRoutes from "./bounty.route";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/daily", dailyRoutes);
router.use("/bounties", bountyRoutes);

export default router;
