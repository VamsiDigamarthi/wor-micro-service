import { captainIds, io, rideLiveCommunication } from "../server.js";
import {
  sendNotfSomeOneAcceptOrder,
  sendRealTimeOrders,
} from "../socket/send-event.js";
import logger from "../utils/logger.js";

const getCaptainSocketInfo = (captains) => {
  return captains.reduce(
    (acc, user) => {
      const socketId = captainIds.get(user?.captainId?.toString());
      if (socketId) {
        acc.socketIds.push(socketId);
      } else {
        acc.notConnectedCaptains.push(user);
      }
      return acc;
    },
    { socketIds: [], notConnectedCaptains: [] }
  );
};

export const handleSharedToCaptain = async ({ order, captains }) => {
  logger.info(
    `📥 Event: ride.sharedToCaptain | Order: ${order?._id} | Captains: ${captains.length}`
  );

  const { socketIds, notConnectedCaptains } = getCaptainSocketInfo(captains);

  logger.info(`✅ Connected Socket IDs: ${JSON.stringify(socketIds)}`);
  logger.warn(
    `❌ Not Connected Captains: ${JSON.stringify(notConnectedCaptains)}`
  );

  if (socketIds.length > 0) {
    await sendRealTimeOrders({ socketIds, order });
  } else {
    logger.warn(`⚠️ No connected captains to send order ${order?._id}`);
  }
};

export const handleSomeOneAcceptOrder = async ({ orderId, captains }) => {
  logger.info(
    `📥 Event: order.someOneAcceptOrder | Order: ${orderId} | Captains: ${captains.length}`
  );

  const { socketIds } = getCaptainSocketInfo(captains);
  await sendNotfSomeOneAcceptOrder({ orderId, socketIds });
};

const getUserSocketId = (orderId, userType) => {
  return rideLiveCommunication.get(orderId)?.get(userType)?.socketId || null;
};

export const handleCaptainAcceptOrder = async ({ order }) => {
  logger.info(`📥 Event: order.captainAcceptOrder | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");
  if (userSocket) io.to(userSocket).emit("order-accept", order);
};

export const handleCaptainArrived = async ({ orderId }) => {
  logger.info(`📥 Event: order.captainIsarrived | Order ID: ${orderId}`);

  const userSocket = getUserSocketId(orderId, "user");
  if (userSocket) io.to(userSocket).emit("order-arrived", true);
};

export const handleOrderOtpVerified = async ({ order }) => {
  logger.info(`📥 Event: order.otpVerified | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");
  if (userSocket)
    io.to(userSocket).emit("order-otp-verified", {
      status: true,
      order,
    });
};

export const handleOrderCompleted = async ({ orderId }) => {
  logger.info(`📥 Event: order.completed | Order ID: ${orderId}`);

  const userSocket = getUserSocketId(orderId, "user");
  if (userSocket) io.to(userSocket).emit("order-completed");
};

export const handleOrderMiddledropNotifyToUser = async ({ order }) => {
  logger.info(`📥 Event: order.middle-drop | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");
  if (userSocket)
    io.to(userSocket).emit("middle-drop", {
      status: true,
      order,
    });
};
