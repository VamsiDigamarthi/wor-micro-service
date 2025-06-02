import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import "dotenv/config";
import { pubClient, redisClient, subClient } from "./redis/redisClient.js";
import { sendNotifyToCaptainForNewOrder } from "./redis/externalEvents.js";
import logger from "./utils/logger.js";
import { handleSocketDisconnect } from "./socket/disconnect-stuff.js";
import setupRideChatNamespace from "./ride-chat.js";
import { connectToRabbitMQ } from "./rabbitmq/rabbitmq.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.adapter(createAdapter(pubClient, subClient));

io.on("connection", (socket) => {
  logger.info(`🟢 Socket connected: ${socket.id}`);

  socket.on("new-captain-connect", async (newUserId) => {
    try {
      const existingSocketId = await redisClient.hget("captainIds", newUserId);
      if (!existingSocketId) {
        logger.info(
          `👤 Registering User: ${newUserId} with socket ${socket.id}`
        );

        await redisClient.hset("captainIds", newUserId, socket.id);

        await redisClient.hset("socketIdToCaptainId", socket.id, newUserId);
      } else {
        logger.info(
          `⚠️ User ${newUserId} already registered with socket ${existingSocketId}`
        );
      }

      const allCaptains = await redisClient.hgetall("captainIds");
      console.log("captainIds (Redis):", allCaptains);
    } catch (err) {
      logger.error("Error in new-captain-connect:", err);
    }
  });

  socket.on("ride-live-communication", async ({ orderId, userType }) => {
    try {
      const key = `rideLiveCommunication:${orderId}`;
      await redisClient.hset(key, userType, socket.id);

      await redisClient.hset(
        "socketIdToOrderUserType",
        socket.id,
        JSON.stringify({ orderId, userType })
      );

      const liveData = await redisClient.hgetall(key);
      console.log(`rideLiveCommunication for order ${orderId}:`, liveData);
    } catch (err) {
      logger.error("Error in ride-live-communication:", err);
    }
  });

  // live tracking
  socket.on("new-send-coordinates", async ({ orderId, coordinates }) => {
    try {
      const key = `rideLiveCommunication:${orderId}`;
      const liveData = await redisClient.hgetall(key);
      const userSocketId = liveData?.user;

      if (userSocketId) {
        io.to(userSocketId).emit("new-receive-coordinates", coordinates);
      }
    } catch (error) {
      logger.error("Error in live tracking:", error);
    }
  });

  socket.on("disconnect", () => {
    handleSocketDisconnect(socket.id);
  });
});

sendNotifyToCaptainForNewOrder();

export { io };

const deleteRideChatKeys = async (redisClient) => {
  try {
    const keys = await redisClient.keys("rideChat:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`✅ Deleted ${keys.length} rideChat:* keys`);
    } else {
      console.log("ℹ️ No rideChat:* keys found to delete");
    }
  } catch (err) {
    console.error("❌ Error deleting rideChat:* keys:", err);
  }
};
// deleteRideChatKeys(redisClient);

connectToRabbitMQ()
  .then(() => {
    console.log("✅ RabbitMQ connected");

    // Start listening only after RabbitMQ is connected
    httpServer.listen(process.env.PORT, () => {
      logger.info(`🚀 socket-service running on port ${process.env.PORT}`);
      setupRideChatNamespace(io, redisClient);
    });
  })
  .catch((err) => {
    logger.error("❌ Failed to connect to RabbitMQ:", err);
    process.exit(1); // Exit if RabbitMQ isn't available
  });
