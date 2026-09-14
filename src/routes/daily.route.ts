import express from "express";
const router = express.Router();

import DailyCtrl from "../controllers/daily.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.use(requireAuth);

router.get("/today", DailyCtrl.today);
router.get("/status", DailyCtrl.status);
router.post("/complete", DailyCtrl.complete);

export default router;
