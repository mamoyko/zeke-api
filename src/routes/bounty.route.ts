import express from "express";
const router = express.Router();

import BountyCtrl from "../controllers/bounty.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.use(requireAuth);

router.get("/word-options", BountyCtrl.wordOptions);
router.get("/wallet", BountyCtrl.wallet);
router.post("/", BountyCtrl.create);
router.get("/incoming", BountyCtrl.incoming);
router.get("/sent", BountyCtrl.sent);
router.get("/opponents", BountyCtrl.opponents);
router.get("/:id/play", BountyCtrl.play);
router.post("/:id/complete", BountyCtrl.complete);

export default router;
