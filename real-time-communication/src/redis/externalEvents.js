import logger from "../utils/logger.js";
import {
  handleCaptainAcceptOrder,
  handleCaptainArrived,
  handleOrderCompleted,
  handleOrderMiddledropNotifyToUser,
  handleOrderOtpVerified,
  handleSharedToCaptain,
  handleSomeOneAcceptOrder,
} from "./redis-event-handler.js";
import { subscribeToRedis } from "./redisClient.js";

export const sendNotifyToCaptainForNewOrder = () => {
  const subscriptions = [
    {
      channel: "ride.sharedToCaptain",
      handler: handleSharedToCaptain,
    },
    {
      channel: "order.someOneAcceptOrder",
      handler: handleSomeOneAcceptOrder,
    },
    {
      channel: "order.captainAcceptOrder",
      handler: handleCaptainAcceptOrder,
    },
    {
      channel: "order.captainIsarrived",
      handler: handleCaptainArrived,
    },
    {
      channel: "order.otpVerified",
      handler: handleOrderOtpVerified,
    },
    {
      channel: "order.completed",
      handler: handleOrderCompleted,
    },
    {
      channel: "order.middle-drop",
      handler: handleOrderMiddledropNotifyToUser,
    },
  ];

  subscriptions.forEach(({ channel, handler }) => {
    subscribeToRedis(channel, async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`❌ Error handling event '${channel}':`, error);
      }
    });
  });
};
