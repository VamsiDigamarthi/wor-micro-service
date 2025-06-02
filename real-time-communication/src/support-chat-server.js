import { io } from "./server.js";
import logger from "./utils/logger.js";

export const supportChatByUserId = new Map();
export const supportChatBySocketId = new Map();

io.of("/new-support-chat").on("connection", (socket) => {
  socket.on(
    "support-chat-connected",
    async ({ chatId, userId, userType = "captain" }) => {
      logger.info("🟢 Support chat connected:", socket.id, userType);

      if (supportChatByUserId.has(userId)) {
        const oldSocketId = supportChatByUserId.get(userId).socketId;
        supportChatBySocketId.delete(oldSocketId);
      }

      supportChatByUserId.set(userId, {
        chatId,
        socketId: socket.id,
        userType,
      });

      supportChatBySocketId.set(socket.id, userId);
    }
  );

  socket.on("disconnect", () => {
    logger.warn("🔴 Support chat disconnected:", socket.id);

    const userId = supportChatBySocketId.get(socket.id);
    if (userId) {
      supportChatBySocketId.delete(socket.id);
      supportChatByUserId.delete(userId);
      logger.warn(`🗑️ Removed support chat user: ${userId}`);
    }
  });
});
