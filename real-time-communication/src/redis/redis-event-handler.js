import {
  middleDropNotification,
  rideArrivedNotification,
  rideCompletedNotification,
  rideOtpVerifiedNotification,
} from "../../../notification/send-notification/socket-notifications.js";
import { io } from "../server.js";
import {
  sendNotfSomeOneAcceptOrder,
  sendRealTimeOrders,
} from "../socket/send-event.js";
import {
  getCaptainSocketInfo,
  getUserSocketId,
} from "../utils/filter-socket-ids.js";
import logger from "../utils/logger.js";

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

export const handleCaptainAcceptOrder = async ({ order }) => {
  logger.info(`📥 Event: order.captainAcceptOrder | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");

  userSocket
    ? io.to(userSocket).emit("order-accept", order)
    : rideAcceptNotification(order);
};

export const handleCaptainArrived = async ({ order }) => {
  logger.info(`📥 Event: order.captainIsarrived | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");
  userSocket
    ? io.to(userSocket).emit("order-arrived", true)
    : rideArrivedNotification(order);
};

export const handleOrderOtpVerified = async ({ order }) => {
  logger.info(`📥 Event: order.otpVerified | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");

  userSocket
    ? io.to(userSocket).emit("order-otp-verified", {
        status: true,
        order,
      })
    : rideOtpVerifiedNotification(order);
};

export const handleOrderCompleted = async ({ order }) => {
  logger.info(`📥 Event: order.completed | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");
  userSocket
    ? io.to(userSocket).emit("order-completed")
    : rideCompletedNotification(order);
};

export const handleOrderMiddledropNotifyToUser = async ({ order }) => {
  logger.info(`📥 Event: order.middle-drop | Order ID: ${order?._id}`);

  const userSocket = getUserSocketId(order?._id, "user");
  userSocket
    ? io.to(userSocket).emit("middle-drop", {
        status: true,
        order,
      })
    : middleDropNotification(order);
};
