import express from "express";
import { getUnreadMessages } from "../controller/support-chat-controller.js";
import { addMessageFromRideChat } from "../controller/ride-chat-controller.js";

const router = express.Router();
router.get("/getunreaded-mesages/:userId/chat/:chatId", getUnreadMessages);

// ride chat

router.post("/ride-chat-message", addMessageFromRideChat);

export default router;
