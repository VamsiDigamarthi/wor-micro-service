import express from "express";
import { getUnreadMessages } from "../controller/chat-controller.js";

const router = express.Router();
router.get("/getunreaded-mesages/:userId/chat/:chatId", getUnreadMessages);

export default router;
