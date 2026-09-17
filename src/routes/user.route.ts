import express from "express";
const router = express.Router();

import UserCtrl from "../controllers/user.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.use(requireAuth);

router.get("/search", UserCtrl.search);

export default router;
