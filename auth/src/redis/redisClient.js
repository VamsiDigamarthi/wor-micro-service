import Redis from "ioredis";
import "dotenv/config";
import logger from "../utils/logger.js";

export const pubClient = new Redis(process.env.REDIS_URL);
export const subClient = pubClient.duplicate();

export const externalSubscriber = new Redis(process.env.REDIS_URL);

export const publishToRedis = (channel, message) => {
  try {
    pubClient.publish(channel, JSON.stringify(message));
    logger.info(`✅ Published to Redis channel ${channel}`, message);
  } catch (err) {
    logger.error(`❌ Failed to publish to Redis channel ${channel}`, err);
  }
};

export const subscribeToRedis = (channel, callback) => {
  subClient.subscribe(channel, (err, count) => {
    if (err) {
      logger.error(`❌ Failed to subscribe to Redis channel ${channel}`, err);
    } else {
      logger.info(`✅ Subscribed to ${channel} (${count} total channels)`);
    }
  });

  subClient.on("message", (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (err) {
        logger.error("❌ Failed to parse Redis message", err);
      }
    }
  });
};
