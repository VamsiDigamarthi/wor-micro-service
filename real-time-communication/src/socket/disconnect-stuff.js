import { redisClient } from "../redis/redisClient.js";
import logger from "../utils/logger.js";

export const handleSocketDisconnect = async (socketId) => {
  logger.info(`🔴 Socket disconnected: ${socketId}`);

  try {
    // Find captainId by socketId
    const captainId = await redisClient.hget("socketIdToCaptainId", socketId);
    if (captainId) {
      // Remove captainId -> socketId mapping
      await redisClient.hdel("captainIds", captainId);
      // Remove socketId -> captainId mapping
      await redisClient.hdel("socketIdToCaptainId", socketId);
      logger.info(`🗑️ Removed Captain ID: ${captainId} from Redis`);
    }

    // Get rideLiveCommunication info for this socket
    const infoStr = await redisClient.hget("socketIdToOrderUserType", socketId);
    if (infoStr) {
      const { orderId, userType } = JSON.parse(infoStr);
      const key = `rideLiveCommunication:${orderId}`;

      // Remove userType from rideLiveCommunication hash for the orderId
      await redisClient.hdel(key, userType);

      // Check if the rideLiveCommunication hash is empty, delete it if yes
      const remaining = await redisClient.hlen(key);
      if (remaining === 0) {
        await redisClient.del(key);
      }

      // Remove reverse lookup socketId entry
      await redisClient.hdel("socketIdToOrderUserType", socketId);

      logger.info(`🗑️ Cleaned rideLiveCommunication for socket ${socketId}`);
    }
  } catch (err) {
    logger.error("Error handling disconnect:", err);
  }
};
