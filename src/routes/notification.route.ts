import express from "express";
const router = express.Router();

import NotificationCtrl from "../controllers/notification.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.use(requireAuth);

router.post("/device-token", NotificationCtrl.registerDeviceToken);
router.delete("/device-token", NotificationCtrl.unregisterDeviceToken);

export default router;
