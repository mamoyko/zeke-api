import express from "express";
import authRoutes from "./auth.route";
import dailyRoutes from "./daily.route";
import bountyRoutes from "./bounty.route";
import notificationRoutes from "./notification.route";
import playRoutes from "./play.route";
import friendRoutes from "./friend.route";
import userRoutes from "./user.route";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/daily", dailyRoutes);
router.use("/bounties", bountyRoutes);
router.use("/notifications", notificationRoutes);
router.use("/play", playRoutes);
router.use("/friends", friendRoutes);
router.use("/users", userRoutes);

export default router;
