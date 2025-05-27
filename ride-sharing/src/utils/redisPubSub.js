import Redis from "ioredis";
import logger from "./logger.js";

export const pubClient = new Redis(process.env.REDIS_URL);
export const subClient = pubClient.duplicate();

export const publishToRedis = (channel, message) => {
  try {
    pubClient.publish(channel, JSON.stringify(message));
    logger.info(`Published to Redis channel ${channel}:`, message);
  } catch (err) {
    logger.error(`Error publishing to Redis channel ${channel}:`, err);
  }
};

export const subscribeToRedis = (channel, callback) => {
  subClient.subscribe(channel, (err, count) => {
    if (err) {
      logger.error(`❌ Failed to subscribe to channel ${channel}:`, err);
      return;
    }
    logger.info(`✅ Subscribed to ${channel} (${count} total subscriptions)`);
  });

  // Listen for messages on all subscribed channels
  subClient.on("message", (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (err) {
        logger.error("❌ Failed to parse Redis message:", err);
      }
    }
  });
};
