import express from "express";
const router = express.Router();

import AuthCtrl from "../controllers/auth.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.post("/signup", AuthCtrl.signup);
router.post("/login", AuthCtrl.login);
router.post("/google", AuthCtrl.google);
router.get("/me", requireAuth, AuthCtrl.me);

export default router;
