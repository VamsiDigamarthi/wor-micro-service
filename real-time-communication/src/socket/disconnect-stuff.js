import {
  captainIds,
  socketIdToCaptainId,
  socketIdToOrderUserType,
} from "../server.js";
import logger from "../utils/logger.js";

export const handleCaptainDisconnect = (socket) => {
  return () => {
    logger.info(`🔴 Socket disconnected: ${socket.id}`);

    const captainId = socketIdToCaptainId.get(socket.id);
    if (captainId) {
      captainIds.delete(captainId);
      socketIdToCaptainId.delete(socket.id);
      logger.info(`🗑️ Removed Captain ID: ${captainId} from tracking`);
      console.log("----------", captainIds);
    }

    // Remove from rideLiveCommunication using reverse lookup
    const info = socketIdToOrderUserType.get(socket.id);
    if (info) {
      const { orderId, userType } = info;
      const userTypeMap = rideLiveCommunication.get(orderId);
      if (userTypeMap) {
        userTypeMap.delete(userType);
        if (userTypeMap.size === 0) {
          rideLiveCommunication.delete(orderId);
        }
      }
      socketIdToOrderUserType.delete(socket.id);
      logger.info(`🗑️ Cleaned rideLiveCommunication for socket ${socket.id}`);
    }
  };
};
