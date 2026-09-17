import express from "express";
const router = express.Router();

import FriendCtrl from "../controllers/friend.controller";
import requireAuth from "../middleware/require-auth.middleware";

router.use(requireAuth);

router.get("/", FriendCtrl.list);
router.post("/", FriendCtrl.add);
router.delete("/:id", FriendCtrl.remove);

export default router;
