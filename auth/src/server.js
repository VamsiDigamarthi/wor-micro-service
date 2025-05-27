import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import AuthRoute from "./routes/auth-route.js";
import mongoose from "mongoose";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";
import { listenToRideEvents } from "./redis/redisEvents.js";
import bodyParser from "body-parser";
import { pubClient } from "./redis/redisClient.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    listenToRideEvents();
    logger.info("Connected to mongodb");
  })
  .catch((e) => logger.error("Mongo connection error", e));

app.use(
  "/api/auth",
  (req, res, next) => {
    req.redisClient = pubClient;
    next();
  },
  AuthRoute
);

async function startServer() {
  try {
    await connectToRabbitMQ();

    // await consumeEvent("ride.fetchcaptains", createSupportChat);

    app.listen(PORT, () => {
      logger.info(`Support Chat is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("🚨 Unhandled Rejection detected!");

  if (reason instanceof Error) {
    logger.error("Reason message:", reason.message);
    logger.error("Stack trace:", reason.stack);
  } else {
    logger.error("Reason:", reason);
  }

  logger.debug("Promise details (may be limited):", promise?.toString?.());
});
