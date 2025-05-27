import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import "dotenv/config";
import { pubClient, subClient } from "./redis/redisClient.js";
import { sendNotifyToCaptainForNewOrder } from "./redis/externalEvents.js";
import logger from "./utils/logger.js";
import { handleCaptainDisconnect } from "./socket/disconnect-stuff.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.adapter(createAdapter(pubClient, subClient));

export let captainIds = new Map();
export let socketIdToCaptainId = new Map();

export const rideLiveCommunication = new Map();
export const socketIdToOrderUserType = new Map();
// const captainSocket = rideLiveCommunication.get("order1")?.get("captain")?.socketId;

io.on("connection", (socket) => {
  logger.info(`🟢 Socket connected: ${socket.id}`);

  socket.on("new-captain-connect", (newUserId) => {
    if (!captainIds.has(newUserId)) {
      logger.info(`👤 Registered User: ${newUserId} with socket ${socket.id}`);
      captainIds.set(newUserId, socket.id);
      socketIdToCaptainId.set(socket.id, newUserId);
    } else {
      logger.info(
        `⚠️ User ${newUserId} already registered with socket ${captainIds.get(
          newUserId
        )}`
      );
    }
    console.log("captainIds", captainIds);
  });

  socket.on("ride-live-communication", ({ orderId, userType }) => {
    if (!rideLiveCommunication.has(orderId)) {
      rideLiveCommunication.set(orderId, new Map());
    }

    const userTypeMap = rideLiveCommunication.get(orderId);

    if (!userTypeMap.has(userType)) {
      userTypeMap.set(userType, {
        socketId: socket.id,
        // add other info if needed
      });
      // Save reverse lookup
      socketIdToOrderUserType.set(socket.id, { orderId, userType });
    }

    console.log("rideLiveCommunication:", rideLiveCommunication);
  });

  socket.on("disconnect", handleCaptainDisconnect(socket));
});

sendNotifyToCaptainForNewOrder();

export { io };

httpServer.listen(process.env.PORT, () => {
  console.log("🚀 socket-service running on port 4001");
});
