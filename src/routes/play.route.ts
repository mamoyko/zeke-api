import express from "express";
const router = express.Router();

import PlayCtrl from "../controllers/play.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.use(requireAuth);

router.post("/reward", PlayCtrl.reward);

export default router;
