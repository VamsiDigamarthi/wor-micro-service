import Redis from "ioredis";
import "dotenv/config";
import logger from "../utils/logger.js";

// Redis clients for Socket.IO adapter
export const pubClient = new Redis(process.env.REDIS_URL);
export const subClient = pubClient.duplicate();

// Function to publish an event
export const publishEvent = async (channel, message) => {
  try {
    await pubClient.publish(channel, JSON.stringify(message));
    console.log(`📤 Published to ${channel}:`, message);
  } catch (error) {
    console.error("❌ Redis publish error:", error);
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
