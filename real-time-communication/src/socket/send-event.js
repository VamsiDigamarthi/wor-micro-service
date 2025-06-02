import { io } from "../server.js";
import logger from "../utils/logger.js";

export const sendRealTimeOrders = async ({ socketIds, order }) => {
  socketIds?.forEach((socketId) => {
    io.to(socketId).emit("new-order", order);
  });
  logger.info("All notifications sent (fire-and-forget).");
};

export const sendNotfSomeOneAcceptOrder = async ({ socketIds, orderId }) => {
  socketIds?.forEach((socketId) => {
    io.to(socketId).emit("another-captain-accept-order", orderId);
  });
  logger.info(`All notifications send some one accept the order ${orderId}`);
};
