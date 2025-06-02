import { publishEvent } from "./rabbitmq/rabbitmq.js";
import logger from "./utils/logger.js";

const setupRideChatNamespace = (io, redisClient) => {
  const NAMESPACE = "/ride-chat";
  const rideChatNamespace = io.of(NAMESPACE);

  // Redis keys helpers
  const userIdKey = (userId) => `rideChat:user:${userId}`;
  const socketIdKey = (socketId) => `rideChat:socket:${socketId}`;
  const orderIdKey = (orderId) => `rideChat:order:${orderId}`;

  rideChatNamespace.on("connection", (socket) => {
    console.log("📨 ride-chat connection established");

    socket.on(
      "ride-chat-connected",
      async ({ orderId, userId, userType = "captain" }) => {
        try {
          const exists = await redisClient.exists(userIdKey(userId));
          if (!exists) {
            await redisClient.hset(userIdKey(userId), {
              orderId,
              socketId: socket.id,
              userType,
            });

            await redisClient.set(socketIdKey(socket.id), userId);
            await redisClient.sadd(orderIdKey(orderId), userId);
          }

          const keys = await redisClient.keys("rideChat:user:*");

          const allUsers = [];
          for (const key of keys) {
            const uid = key.split(":")[2];
            const data = await redisClient.hgetall(key);
            allUsers.push({ userId: uid, ...data });
          }

          logger.info("rideChat users (Redis):", allUsers);
        } catch (err) {
          logger.error("Error in ride-chat-connected:", err);
        }
      }
    );

    socket.on("message", async ({ orderId, text, sender, userId }) => {
      try {
        const message = { sender, text, timestamp: new Date() };
        const recipients = await redisClient.smembers(orderIdKey(orderId));
        console.log("recipients", recipients);

        if (!recipients || recipients.length === 0) return;

        for (const uid of recipients) {
          console.log("uid", uid);

          if (uid === userId) continue;
          const userData = await redisClient.hgetall(userIdKey(uid));
          console.log("userData", userData);

          if (userData?.socketId) {
            rideChatNamespace.to(userData.socketId).emit("newMessage", message);
            logger.info(`Message sent to user ${uid} in order ${orderId}`);
          } else {
            // send notification to another person
            await publishEvent("ridechat.newmessage", {
              sender,
              userId,
              message: text,
            });
          }
        }
      } catch (err) {
        logger.error("Error sending ride chat message:", err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const userId = await redisClient.get(socketIdKey(socket.id));

        if (!userId) {
          logger.warn(
            `❌ socketId not found in Redis on disconnect: ${socket.id}`
          );
          return;
        }

        const user = await redisClient.hgetall(userIdKey(userId));

        await redisClient.del(userIdKey(userId));
        await redisClient.del(socketIdKey(socket.id));

        if (user?.orderId) {
          await redisClient.srem(orderIdKey(user.orderId), userId);
          const remaining = await redisClient.scard(orderIdKey(user.orderId));
          if (remaining === 0) {
            await redisClient.del(orderIdKey(user.orderId));
          }
        }

        const keys = await redisClient.keys("rideChat:user:*");

        const allUsers = [];
        for (const key of keys) {
          const uid = key.split(":")[2];
          const data = await redisClient.hgetall(key);
          allUsers.push({ userId: uid, ...data });
        }

        logger.warn(`🚫 Cleaned up user: ${userId} (socket: ${socket.id})`);
        logger.info(`🟢 Remaining connected users after disconnect:`);
        console.log(allUsers);
      } catch (err) {
        logger.error("Error handling ride-chat disconnect:", err);
      }
    });
  });
};

export default setupRideChatNamespace;
